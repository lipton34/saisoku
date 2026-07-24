import crypto from "node:crypto";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { Router, type Request } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";
import {
  copyBuildImageInStorage,
  removeBuildImagesFromStorage,
  uploadBuildImageToStorage
} from "../services/buildImageStorage.js";

const buildsRouter = Router();
const buildDraftsRouter = Router();
buildsRouter.use(requireAuth);
buildDraftsRouter.use(requireAuth);

const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBuildImages = 5;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function currentUserId(req: Request) {
  return req.user?.id ?? "";
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  return text(value) || null;
}

function normalizeTitle(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/\s+/g, "");
}

function buildFields(body: Record<string, unknown>) {
  return {
    title: optionalText(body.title),
    questName: optionalText(body.questName),
    overview: optionalText(body.overview),
    supplementalNotes: optionalText(body.supplementalNotes),
    referenceUrl: optionalText(body.referenceUrl)
  };
}

function serializePost<T extends { owner: { displayName: string | null; username: string }; images: unknown[] }>(
  post: T
) {
  const { owner, ...rest } = post;
  return { ...rest, authorName: owner.displayName ?? owner.username };
}

function extensionFor(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
    return extension === ".jpeg" ? ".jpg" : extension;
  }
  return file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
}

function imageUploadError(error: unknown, res: Parameters<Parameters<typeof buildsRouter.post>[1]>[1]) {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ message: "画像は1ファイル5MBまでです" });
    return true;
  }
  if (error instanceof Error && error.message.includes("Supabase Storage設定")) {
    res.status(500).json({ message: error.message });
    return true;
  }
  return false;
}

const postInclude = {
  owner: { select: { displayName: true, username: true } },
  images: { orderBy: [{ displayOrder: "asc" as const }, { createdAt: "asc" as const }] }
};

buildsRouter.get("/", async (req, res, next) => {
  try {
    const query = text(req.query.query);
    const posts = await prisma.buildPost.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { questName: { contains: query, mode: "insensitive" } },
              { overview: { contains: query, mode: "insensitive" } },
              { supplementalNotes: { contains: query, mode: "insensitive" } }
            ]
          }
        : undefined,
      include: postInclude,
      orderBy: { updatedAt: "desc" }
    });
    res.json({ posts: posts.map(serializePost) });
  } catch (error) {
    next(error);
  }
});

buildsRouter.get("/:id", async (req, res, next) => {
  try {
    const post = await prisma.buildPost.findUnique({ where: { id: text(req.params.id) }, include: postInclude });
    if (!post) {
      res.status(404).json({ message: "編成が見つかりません" });
      return;
    }
    res.json({ post: serializePost(post) });
  } catch (error) {
    next(error);
  }
});

buildsRouter.post("/", async (req, res, next) => {
  try {
    const fields = buildFields(req.body as Record<string, unknown>);
    if (!fields.title) {
      res.status(400).json({ message: "タイトルを入力してください" });
      return;
    }
    const post = await prisma.buildPost.create({
      data: {
        ...fields,
        title: fields.title,
        normalizedTitle: normalizeTitle(fields.title),
        ownerId: currentUserId(req)
      },
      include: postInclude
    });
    res.status(201).json({ post: serializePost(post) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "同じタイトルの投稿が既にあります" });
      return;
    }
    next(error);
  }
});

buildsRouter.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.buildPost.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) }
    });
    if (!existing) {
      res.status(404).json({ message: "編成が見つかりません" });
      return;
    }
    const fields = buildFields(req.body as Record<string, unknown>);
    if (!fields.title) {
      res.status(400).json({ message: "タイトルを入力してください" });
      return;
    }
    const post = await prisma.buildPost.update({
      where: { id: existing.id },
      data: { ...fields, title: fields.title, normalizedTitle: normalizeTitle(fields.title) },
      include: postInclude
    });
    res.json({ post: serializePost(post) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "同じタイトルの投稿が既にあります" });
      return;
    }
    next(error);
  }
});

buildsRouter.post("/:id/images", upload.single("image"), async (req, res, next) => {
  try {
    const post = await prisma.buildPost.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) },
      select: { id: true }
    });
    if (!post) {
      res.status(404).json({ message: "編成が見つかりません" });
      return;
    }
    if (!req.file || !allowedImageMimeTypes.has(req.file.mimetype)) {
      res.status(400).json({ message: "JPEG、PNG、WebPの画像を選択してください" });
      return;
    }
    const count = await prisma.buildPostImage.count({ where: { buildPostId: post.id } });
    if (count >= maxBuildImages) {
      res.status(400).json({ message: "画像は最大5枚までです" });
      return;
    }
    const storagePath = `posts/${post.id}/${Date.now()}-${crypto.randomUUID()}${extensionFor(req.file)}`;
    const stored = await uploadBuildImageToStorage({
      path: storagePath,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype
    });
    const image = await prisma.buildPostImage.create({
      data: {
        buildPostId: post.id,
        storageBucket: stored.bucket,
        storagePath,
        publicUrl: stored.publicUrl,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        displayOrder: count
      }
    });
    res.status(201).json({ image });
  } catch (error) {
    if (!imageUploadError(error, res)) next(error);
  }
});

buildsRouter.put("/:id/images/order", async (req, res, next) => {
  try {
    const post = await prisma.buildPost.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) },
      select: { id: true }
    });
    const imageIds = Array.isArray(req.body.imageIds) ? req.body.imageIds.filter((id: unknown) => typeof id === "string") : [];
    if (!post || imageIds.length > maxBuildImages) {
      res.status(400).json({ message: "画像の並び順を更新できません" });
      return;
    }
    const ownedCount = await prisma.buildPostImage.count({ where: { buildPostId: post.id, id: { in: imageIds } } });
    if (ownedCount !== imageIds.length) {
      res.status(400).json({ message: "画像の並び順を更新できません" });
      return;
    }
    await prisma.$transaction(
      imageIds.map((id: string, displayOrder: number) =>
        prisma.buildPostImage.update({ where: { id }, data: { displayOrder } })
      )
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

buildsRouter.delete("/:id/images/:imageId", async (req, res, next) => {
  try {
    const image = await prisma.buildPostImage.findFirst({
      where: { id: req.params.imageId, buildPostId: req.params.id, buildPost: { ownerId: currentUserId(req) } }
    });
    if (!image) {
      res.status(404).json({ message: "画像が見つかりません" });
      return;
    }
    await prisma.buildPostImage.delete({ where: { id: image.id } });
    try {
      await removeBuildImagesFromStorage([image]);
    } catch (storageError) {
      console.warn("Failed to remove build image from storage", storageError);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

buildsRouter.delete("/:id", async (req, res, next) => {
  try {
    const post = await prisma.buildPost.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) },
      include: { images: true }
    });
    if (!post) {
      res.status(404).json({ message: "編成が見つかりません" });
      return;
    }
    await prisma.buildPost.delete({ where: { id: post.id } });
    try {
      await removeBuildImagesFromStorage(post.images);
    } catch (storageError) {
      console.warn("Failed to remove build images from storage", storageError);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

buildDraftsRouter.get("/", async (req, res, next) => {
  try {
    const drafts = await prisma.buildDraft.findMany({
      where: { ownerId: currentUserId(req) },
      include: { images: { orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } },
      orderBy: { updatedAt: "desc" }
    });
    res.json({ drafts });
  } catch (error) {
    next(error);
  }
});

buildDraftsRouter.get("/:id", async (req, res, next) => {
  try {
    const draft = await prisma.buildDraft.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) },
      include: { images: { orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } }
    });
    if (!draft) {
      res.status(404).json({ message: "下書きが見つかりません" });
      return;
    }
    res.json({ draft });
  } catch (error) {
    next(error);
  }
});

buildDraftsRouter.post("/", async (req, res, next) => {
  try {
    const fields = buildFields(req.body as Record<string, unknown>);
    const draft = await prisma.buildDraft.create({
      data: { ...fields, ownerId: currentUserId(req) },
      include: { images: true }
    });
    res.status(201).json({ draft });
  } catch (error) {
    next(error);
  }
});

buildDraftsRouter.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.buildDraft.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) },
      select: { id: true }
    });
    if (!existing) {
      res.status(404).json({ message: "下書きが見つかりません" });
      return;
    }
    const draft = await prisma.buildDraft.update({
      where: { id: existing.id },
      data: buildFields(req.body as Record<string, unknown>),
      include: { images: { orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } }
    });
    res.json({ draft });
  } catch (error) {
    next(error);
  }
});

buildDraftsRouter.post("/:id/publish", async (req, res, next) => {
  try {
    const draft = await prisma.buildDraft.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) },
      include: { images: { orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } }
    });
    const title = draft?.title?.trim();
    if (!draft || !title) {
      res.status(400).json({ message: "投稿するにはタイトルが必要です" });
      return;
    }
    const post = await prisma.buildPost.create({
      data: {
        title,
        normalizedTitle: normalizeTitle(title),
        questName: draft.questName,
        overview: draft.overview,
        supplementalNotes: draft.supplementalNotes,
        referenceUrl: draft.referenceUrl,
        ownerId: currentUserId(req)
      },
      include: postInclude
    });
    const copiedImages: { storageBucket: string; storagePath: string }[] = [];
    try {
      for (const draftImage of draft.images) {
        const destinationPath = `posts/${post.id}/${Date.now()}-${crypto.randomUUID()}${path.extname(draftImage.storagePath)}`;
        const copied = await copyBuildImageInStorage({
          bucket: draftImage.storageBucket,
          sourcePath: draftImage.storagePath,
          destinationPath
        });
        copiedImages.push({ storageBucket: draftImage.storageBucket, storagePath: destinationPath });
        await prisma.buildPostImage.create({
          data: {
            buildPostId: post.id,
            storageBucket: draftImage.storageBucket,
            storagePath: destinationPath,
            publicUrl: copied.publicUrl,
            originalName: draftImage.originalName,
            mimeType: draftImage.mimeType,
            sizeBytes: draftImage.sizeBytes,
            displayOrder: draftImage.displayOrder
          }
        });
      }
    } catch (copyError) {
      await prisma.buildPost.delete({ where: { id: post.id } });
      try {
        await removeBuildImagesFromStorage(copiedImages);
      } catch (cleanupError) {
        console.warn("Failed to clean up copied build images", cleanupError);
      }
      throw copyError;
    }
    const published = await prisma.buildPost.findUniqueOrThrow({ where: { id: post.id }, include: postInclude });
    res.status(201).json({ post: serializePost(published) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "同じタイトルの投稿が既にあります" });
      return;
    }
    next(error);
  }
});

buildDraftsRouter.post("/:id/images", upload.single("image"), async (req, res, next) => {
  try {
    const draft = await prisma.buildDraft.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) },
      select: { id: true }
    });
    if (!draft) {
      res.status(404).json({ message: "下書きが見つかりません" });
      return;
    }
    if (!req.file || !allowedImageMimeTypes.has(req.file.mimetype)) {
      res.status(400).json({ message: "JPEG、PNG、WebPの画像を選択してください" });
      return;
    }
    const count = await prisma.buildDraftImage.count({ where: { buildDraftId: draft.id } });
    if (count >= maxBuildImages) {
      res.status(400).json({ message: "画像は最大5枚までです" });
      return;
    }
    const storagePath = `drafts/${draft.id}/${Date.now()}-${crypto.randomUUID()}${extensionFor(req.file)}`;
    const stored = await uploadBuildImageToStorage({
      path: storagePath,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype
    });
    const image = await prisma.buildDraftImage.create({
      data: {
        buildDraftId: draft.id,
        storageBucket: stored.bucket,
        storagePath,
        publicUrl: stored.publicUrl,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        displayOrder: count
      }
    });
    res.status(201).json({ image });
  } catch (error) {
    if (!imageUploadError(error, res)) next(error);
  }
});

buildDraftsRouter.put("/:id/images/order", async (req, res, next) => {
  try {
    const draft = await prisma.buildDraft.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) },
      select: { id: true }
    });
    const imageIds = Array.isArray(req.body.imageIds) ? req.body.imageIds.filter((id: unknown) => typeof id === "string") : [];
    if (!draft || imageIds.length > maxBuildImages) {
      res.status(400).json({ message: "画像の並び順を更新できません" });
      return;
    }
    const ownedCount = await prisma.buildDraftImage.count({ where: { buildDraftId: draft.id, id: { in: imageIds } } });
    if (ownedCount !== imageIds.length) {
      res.status(400).json({ message: "画像の並び順を更新できません" });
      return;
    }
    await prisma.$transaction(
      imageIds.map((id: string, displayOrder: number) =>
        prisma.buildDraftImage.update({ where: { id }, data: { displayOrder } })
      )
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

buildDraftsRouter.delete("/:id/images/:imageId", async (req, res, next) => {
  try {
    const image = await prisma.buildDraftImage.findFirst({
      where: { id: req.params.imageId, buildDraftId: req.params.id, buildDraft: { ownerId: currentUserId(req) } }
    });
    if (!image) {
      res.status(404).json({ message: "画像が見つかりません" });
      return;
    }
    await prisma.buildDraftImage.delete({ where: { id: image.id } });
    try {
      await removeBuildImagesFromStorage([image]);
    } catch (storageError) {
      console.warn("Failed to remove draft image from storage", storageError);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

buildDraftsRouter.delete("/:id", async (req, res, next) => {
  try {
    const draft = await prisma.buildDraft.findFirst({
      where: { id: text(req.params.id), ownerId: currentUserId(req) },
      include: { images: true }
    });
    if (!draft) {
      res.status(404).json({ message: "下書きが見つかりません" });
      return;
    }
    await prisma.buildDraft.delete({ where: { id: draft.id } });
    try {
      await removeBuildImagesFromStorage(draft.images);
    } catch (storageError) {
      console.warn("Failed to remove draft images from storage", storageError);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { buildsRouter, buildDraftsRouter };
