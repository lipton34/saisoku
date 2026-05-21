# 公式NEWS取得可否 調査結果

生成日時: 2026-05-21T09:41:25.258Z

## 方針

- 対象ページのHTML本文そのものは保存しない。
- 保存するのは件数、検出結果、短い確認用スニペット、URL、判定のみ。
- 本スクリプトは本実装前の到達性・構造確認用であり、常時スクレイピング機能ではない。

## 総合判定

- https://granbluefantasy.com/ja/news/: HTMLはページシェル中心、記事固有情報は要追加調査
- https://granbluefantasy.com/ja/news/category/: HTMLはページシェル中心、記事固有情報は要追加調査
- https://granbluefantasy.com/ja/news/category/?p=update: HTMLはページシェル中心、記事固有情報は要追加調査
- https://granbluefantasy.com/ja/news/archive/?p=20265: HTMLはページシェル中心、記事固有情報は要追加調査
- https://granbluefantasy.com/ja/news/archive/?p=20264: HTMLはページシェル中心、記事固有情報は要追加調査
- https://granbluefantasy.com/ja/news/9690/: HTML直接取得は要追加調査
- Playwright: 未実行（browserType.launch: Target page, context or browser has been closed）

## 対象URL別結果

### https://granbluefantasy.com/ja/news/

- HTTPステータスコード: 200
- 最終URL: https://granbluefantasy.com/ja/news/
- Content-Type: text/html
- HTMLサイズ: 17049 bytes
- titleタグ: News | グランブルーファンタジー 公式サイト | Cygames
- scriptタグの数: 6
- linkタグの数: 63
- HTML内の記事タイトル候補: なし (0件)
なし
- HTML内の公開日時らしき文字列: なし (0件)
なし
- HTML内のカテゴリ文字列: あり (1件)
  - event
- HTML内の記事詳細URL: なし (0件)
なし
- HTML内のJSONらしきデータ: あり (3件)
  - {"@context":"https://schema.org","@type":"WebSite","name":"グランブルーファンタジー 公式サイト","url":"https://granbluefantasy.com/","alternateName":["グラブル","グランブルーファンタジー","granblue","gbf","これグラ","...
  - application/ld+json
  - api
- 本文/ページテキスト確認スニペット: News | グランブルーファンタジー 公式サイト | Cygames News | グランブルーファンタジー 公式サイト | Cygames ja News World Character メインキャラクター メインストーリー 「イスタルシア編」 旅の仲間たち メインストーリー 「新章」 旅の仲間たち System Interview Channel ぐらぶるちゃんねるっ！ ぐらぶるTVちゃんねるっ！ Official Account JA / EN NEWS CONTEN
- JavaScriptファイル内の news/archive/category/api 文字列: あり (5/20ファイル)
  - https://cdn-au.onetrust.com/consent/019bb67d-0ed6-7301-a02e-5a77018a8e00/OtAutoBlock.js (200, 6020 bytes): category
    - =k.Tag.indexOf(d)||(g=k)}}return g}(a,G);return e.CategoryId&&(c=e.CategoryId),e.Vendor&&(b=e.Vendor.split(":")),!e.Tag&&H&&(b=c=f
  - https://cdn-au.onetrust.com/scripttemplates/otSDKStub.js (200, 26819 bytes): api
    - on"==typeof s.win.__gpp||(s.win.__gpp=s.executeGppApi,window.addEventListener("message",s.messageHandler,!1),s.addFrame(s.LOCATOR_
  - https://granbluefantasy.com/_app/immutable/entry/app.Cb-0uWdr.js (200, 11183 bytes): news, archive, category
    - ","../assets/LowerLayout.Cb4DAURt.css","../chunks/news_text_16.JqEfOfoW.js","../chunks/modal.D_6fvLGM.js","../assets/modal.BrBh0gO
    - 1],"/interview/[id]":[12],"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choi
    - ,"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choices":[18],"/privacy":[17]
  - https://granbluefantasy.com/_app/immutable/nodes/0.C58OBAER.js (200, 17240 bytes): news, api
    - const J=p(()=>s.data.currentLang),q=p(()=>[{key:r.NEWS,path:g()[r.NEWS].path,label:ze()},{key:r.WORLD,path:g()[r.WORLD].path,label
    - ' <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="
  - https://granbluefantasy.com/_app/immutable/chunks/page_settings.CQaITPUw.js (200, 7445 bytes): news, api
    - n t==="ja"?O():t==="en"?S():"cmn_text_21"},x=()=>"News | グランブルーファンタジー公式サイト | Cygames",W=x,P=(n={},e={})=>{const t=e.locale??a();re
    - /files/user",Wt="https://granbluefantasy.com/rcms-api",Pt="https://granbluefantasy.com",m=()=>"ぐらぶるちゃんねるっ！",h=m,A=(n={},e={})=>{co

### https://granbluefantasy.com/ja/news/category/

- HTTPステータスコード: 200
- 最終URL: https://granbluefantasy.com/ja/news/category/
- Content-Type: text/html
- HTMLサイズ: 17225 bytes
- titleタグ: News | グランブルーファンタジー公式サイト | Cygames
- scriptタグの数: 6
- linkタグの数: 64
- HTML内の記事タイトル候補: なし (0件)
なし
- HTML内の公開日時らしき文字列: なし (0件)
なし
- HTML内のカテゴリ文字列: あり (1件)
  - event
- HTML内の記事詳細URL: なし (0件)
なし
- HTML内のJSONらしきデータ: あり (3件)
  - {"@context":"https://schema.org","@type":"WebSite","name":"グランブルーファンタジー 公式サイト","url":"https://granbluefantasy.com/","alternateName":["グラブル","グランブルーファンタジー","granblue","gbf","これグラ","...
  - application/ld+json
  - api
- 本文/ページテキスト確認スニペット: News | グランブルーファンタジー公式サイト | Cygames News | グランブルーファンタジー 公式サイト | Cygames ja News World Character メインキャラクター メインストーリー 「イスタルシア編」 旅の仲間たち メインストーリー 「新章」 旅の仲間たち System Interview Channel ぐらぶるちゃんねるっ！ ぐらぶるTVちゃんねるっ！ Official Account JA / EN NEWS CONTENT
- JavaScriptファイル内の news/archive/category/api 文字列: あり (5/20ファイル)
  - https://cdn-au.onetrust.com/consent/019bb67d-0ed6-7301-a02e-5a77018a8e00/OtAutoBlock.js (200, 6020 bytes): category
    - =k.Tag.indexOf(d)||(g=k)}}return g}(a,G);return e.CategoryId&&(c=e.CategoryId),e.Vendor&&(b=e.Vendor.split(":")),!e.Tag&&H&&(b=c=f
  - https://cdn-au.onetrust.com/scripttemplates/otSDKStub.js (200, 26819 bytes): api
    - on"==typeof s.win.__gpp||(s.win.__gpp=s.executeGppApi,window.addEventListener("message",s.messageHandler,!1),s.addFrame(s.LOCATOR_
  - https://granbluefantasy.com/_app/immutable/entry/app.Cb-0uWdr.js (200, 11183 bytes): news, archive, category
    - ","../assets/LowerLayout.Cb4DAURt.css","../chunks/news_text_16.JqEfOfoW.js","../chunks/modal.D_6fvLGM.js","../assets/modal.BrBh0gO
    - 1],"/interview/[id]":[12],"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choi
    - ,"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choices":[18],"/privacy":[17]
  - https://granbluefantasy.com/_app/immutable/nodes/0.C58OBAER.js (200, 17240 bytes): news, api
    - const J=p(()=>s.data.currentLang),q=p(()=>[{key:r.NEWS,path:g()[r.NEWS].path,label:ze()},{key:r.WORLD,path:g()[r.WORLD].path,label
    - ' <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="
  - https://granbluefantasy.com/_app/immutable/chunks/page_settings.CQaITPUw.js (200, 7445 bytes): news, api
    - n t==="ja"?O():t==="en"?S():"cmn_text_21"},x=()=>"News | グランブルーファンタジー公式サイト | Cygames",W=x,P=(n={},e={})=>{const t=e.locale??a();re
    - /files/user",Wt="https://granbluefantasy.com/rcms-api",Pt="https://granbluefantasy.com",m=()=>"ぐらぶるちゃんねるっ！",h=m,A=(n={},e={})=>{co

### https://granbluefantasy.com/ja/news/category/?p=update

- HTTPステータスコード: 200
- 最終URL: https://granbluefantasy.com/ja/news/category/?p=update
- Content-Type: text/html
- HTMLサイズ: 17225 bytes
- titleタグ: News | グランブルーファンタジー公式サイト | Cygames
- scriptタグの数: 6
- linkタグの数: 64
- HTML内の記事タイトル候補: なし (0件)
なし
- HTML内の公開日時らしき文字列: なし (0件)
なし
- HTML内のカテゴリ文字列: あり (1件)
  - event
- HTML内の記事詳細URL: なし (0件)
なし
- HTML内のJSONらしきデータ: あり (3件)
  - {"@context":"https://schema.org","@type":"WebSite","name":"グランブルーファンタジー 公式サイト","url":"https://granbluefantasy.com/","alternateName":["グラブル","グランブルーファンタジー","granblue","gbf","これグラ","...
  - application/ld+json
  - api
- 本文/ページテキスト確認スニペット: News | グランブルーファンタジー公式サイト | Cygames News | グランブルーファンタジー 公式サイト | Cygames ja News World Character メインキャラクター メインストーリー 「イスタルシア編」 旅の仲間たち メインストーリー 「新章」 旅の仲間たち System Interview Channel ぐらぶるちゃんねるっ！ ぐらぶるTVちゃんねるっ！ Official Account JA / EN NEWS CONTENT
- JavaScriptファイル内の news/archive/category/api 文字列: あり (5/20ファイル)
  - https://cdn-au.onetrust.com/consent/019bb67d-0ed6-7301-a02e-5a77018a8e00/OtAutoBlock.js (200, 6020 bytes): category
    - =k.Tag.indexOf(d)||(g=k)}}return g}(a,G);return e.CategoryId&&(c=e.CategoryId),e.Vendor&&(b=e.Vendor.split(":")),!e.Tag&&H&&(b=c=f
  - https://cdn-au.onetrust.com/scripttemplates/otSDKStub.js (200, 26819 bytes): api
    - on"==typeof s.win.__gpp||(s.win.__gpp=s.executeGppApi,window.addEventListener("message",s.messageHandler,!1),s.addFrame(s.LOCATOR_
  - https://granbluefantasy.com/_app/immutable/entry/app.Cb-0uWdr.js (200, 11183 bytes): news, archive, category
    - ","../assets/LowerLayout.Cb4DAURt.css","../chunks/news_text_16.JqEfOfoW.js","../chunks/modal.D_6fvLGM.js","../assets/modal.BrBh0gO
    - 1],"/interview/[id]":[12],"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choi
    - ,"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choices":[18],"/privacy":[17]
  - https://granbluefantasy.com/_app/immutable/nodes/0.C58OBAER.js (200, 17240 bytes): news, api
    - const J=p(()=>s.data.currentLang),q=p(()=>[{key:r.NEWS,path:g()[r.NEWS].path,label:ze()},{key:r.WORLD,path:g()[r.WORLD].path,label
    - ' <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="
  - https://granbluefantasy.com/_app/immutable/chunks/page_settings.CQaITPUw.js (200, 7445 bytes): news, api
    - n t==="ja"?O():t==="en"?S():"cmn_text_21"},x=()=>"News | グランブルーファンタジー公式サイト | Cygames",W=x,P=(n={},e={})=>{const t=e.locale??a();re
    - /files/user",Wt="https://granbluefantasy.com/rcms-api",Pt="https://granbluefantasy.com",m=()=>"ぐらぶるちゃんねるっ！",h=m,A=(n={},e={})=>{co

### https://granbluefantasy.com/ja/news/archive/?p=20265

- HTTPステータスコード: 200
- 最終URL: https://granbluefantasy.com/ja/news/archive/?p=20265
- Content-Type: text/html
- HTMLサイズ: 17136 bytes
- titleタグ: News | グランブルーファンタジー公式サイト | Cygames
- scriptタグの数: 6
- linkタグの数: 63
- HTML内の記事タイトル候補: なし (0件)
なし
- HTML内の公開日時らしき文字列: なし (0件)
なし
- HTML内のカテゴリ文字列: あり (1件)
  - event
- HTML内の記事詳細URL: なし (0件)
なし
- HTML内のJSONらしきデータ: あり (3件)
  - {"@context":"https://schema.org","@type":"WebSite","name":"グランブルーファンタジー 公式サイト","url":"https://granbluefantasy.com/","alternateName":["グラブル","グランブルーファンタジー","granblue","gbf","これグラ","...
  - application/ld+json
  - api
- 本文/ページテキスト確認スニペット: News | グランブルーファンタジー公式サイト | Cygames News | グランブルーファンタジー 公式サイト | Cygames ja News World Character メインキャラクター メインストーリー 「イスタルシア編」 旅の仲間たち メインストーリー 「新章」 旅の仲間たち System Interview Channel ぐらぶるちゃんねるっ！ ぐらぶるTVちゃんねるっ！ Official Account JA / EN NEWS CONTENT
- JavaScriptファイル内の news/archive/category/api 文字列: あり (5/20ファイル)
  - https://cdn-au.onetrust.com/consent/019bb67d-0ed6-7301-a02e-5a77018a8e00/OtAutoBlock.js (200, 6020 bytes): category
    - =k.Tag.indexOf(d)||(g=k)}}return g}(a,G);return e.CategoryId&&(c=e.CategoryId),e.Vendor&&(b=e.Vendor.split(":")),!e.Tag&&H&&(b=c=f
  - https://cdn-au.onetrust.com/scripttemplates/otSDKStub.js (200, 26819 bytes): api
    - on"==typeof s.win.__gpp||(s.win.__gpp=s.executeGppApi,window.addEventListener("message",s.messageHandler,!1),s.addFrame(s.LOCATOR_
  - https://granbluefantasy.com/_app/immutable/entry/app.Cb-0uWdr.js (200, 11183 bytes): news, archive, category
    - ","../assets/LowerLayout.Cb4DAURt.css","../chunks/news_text_16.JqEfOfoW.js","../chunks/modal.D_6fvLGM.js","../assets/modal.BrBh0gO
    - 1],"/interview/[id]":[12],"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choi
    - ,"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choices":[18],"/privacy":[17]
  - https://granbluefantasy.com/_app/immutable/nodes/0.C58OBAER.js (200, 17240 bytes): news, api
    - const J=p(()=>s.data.currentLang),q=p(()=>[{key:r.NEWS,path:g()[r.NEWS].path,label:ze()},{key:r.WORLD,path:g()[r.WORLD].path,label
    - ' <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="
  - https://granbluefantasy.com/_app/immutable/chunks/page_settings.CQaITPUw.js (200, 7445 bytes): news, api
    - n t==="ja"?O():t==="en"?S():"cmn_text_21"},x=()=>"News | グランブルーファンタジー公式サイト | Cygames",W=x,P=(n={},e={})=>{const t=e.locale??a();re
    - /files/user",Wt="https://granbluefantasy.com/rcms-api",Pt="https://granbluefantasy.com",m=()=>"ぐらぶるちゃんねるっ！",h=m,A=(n={},e={})=>{co

### https://granbluefantasy.com/ja/news/archive/?p=20264

- HTTPステータスコード: 200
- 最終URL: https://granbluefantasy.com/ja/news/archive/?p=20264
- Content-Type: text/html
- HTMLサイズ: 17136 bytes
- titleタグ: News | グランブルーファンタジー公式サイト | Cygames
- scriptタグの数: 6
- linkタグの数: 63
- HTML内の記事タイトル候補: なし (0件)
なし
- HTML内の公開日時らしき文字列: なし (0件)
なし
- HTML内のカテゴリ文字列: あり (1件)
  - event
- HTML内の記事詳細URL: なし (0件)
なし
- HTML内のJSONらしきデータ: あり (3件)
  - {"@context":"https://schema.org","@type":"WebSite","name":"グランブルーファンタジー 公式サイト","url":"https://granbluefantasy.com/","alternateName":["グラブル","グランブルーファンタジー","granblue","gbf","これグラ","...
  - application/ld+json
  - api
- 本文/ページテキスト確認スニペット: News | グランブルーファンタジー公式サイト | Cygames News | グランブルーファンタジー 公式サイト | Cygames ja News World Character メインキャラクター メインストーリー 「イスタルシア編」 旅の仲間たち メインストーリー 「新章」 旅の仲間たち System Interview Channel ぐらぶるちゃんねるっ！ ぐらぶるTVちゃんねるっ！ Official Account JA / EN NEWS CONTENT
- JavaScriptファイル内の news/archive/category/api 文字列: あり (5/20ファイル)
  - https://cdn-au.onetrust.com/consent/019bb67d-0ed6-7301-a02e-5a77018a8e00/OtAutoBlock.js (200, 6020 bytes): category
    - =k.Tag.indexOf(d)||(g=k)}}return g}(a,G);return e.CategoryId&&(c=e.CategoryId),e.Vendor&&(b=e.Vendor.split(":")),!e.Tag&&H&&(b=c=f
  - https://cdn-au.onetrust.com/scripttemplates/otSDKStub.js (200, 26819 bytes): api
    - on"==typeof s.win.__gpp||(s.win.__gpp=s.executeGppApi,window.addEventListener("message",s.messageHandler,!1),s.addFrame(s.LOCATOR_
  - https://granbluefantasy.com/_app/immutable/entry/app.Cb-0uWdr.js (200, 11183 bytes): news, archive, category
    - ","../assets/LowerLayout.Cb4DAURt.css","../chunks/news_text_16.JqEfOfoW.js","../chunks/modal.D_6fvLGM.js","../assets/modal.BrBh0gO
    - 1],"/interview/[id]":[12],"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choi
    - ,"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choices":[18],"/privacy":[17]
  - https://granbluefantasy.com/_app/immutable/nodes/0.C58OBAER.js (200, 17240 bytes): news, api
    - const J=p(()=>s.data.currentLang),q=p(()=>[{key:r.NEWS,path:g()[r.NEWS].path,label:ze()},{key:r.WORLD,path:g()[r.WORLD].path,label
    - ' <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="
  - https://granbluefantasy.com/_app/immutable/chunks/page_settings.CQaITPUw.js (200, 7445 bytes): news, api
    - n t==="ja"?O():t==="en"?S():"cmn_text_21"},x=()=>"News | グランブルーファンタジー公式サイト | Cygames",W=x,P=(n={},e={})=>{const t=e.locale??a();re
    - /files/user",Wt="https://granbluefantasy.com/rcms-api",Pt="https://granbluefantasy.com",m=()=>"ぐらぶるちゃんねるっ！",h=m,A=(n={},e={})=>{co

### https://granbluefantasy.com/ja/news/9690/

- HTTPステータスコード: 200
- 最終URL: https://granbluefantasy.com/ja/news/9690/
- Content-Type: text/html
- HTMLサイズ: 4357 bytes
- titleタグ: グランブルーファンタジー 公式サイト | Cygames
- scriptタグの数: 5
- linkタグの数: 17
- HTML内の記事タイトル候補: なし (0件)
なし
- HTML内の公開日時らしき文字列: なし (0件)
なし
- HTML内のカテゴリ文字列: あり (1件)
  - event
- HTML内の記事詳細URL: なし (0件)
なし
- HTML内のJSONらしきデータ: なし (0件)
なし
- 本文/ページテキスト確認スニペット: グランブルーファンタジー 公式サイト | Cygames
- 記事詳細ページの本文候補: なし
- 開催期間・実施期間候補: なし (0件)
なし
- JavaScriptファイル内の news/archive/category/api 文字列: あり (3/16ファイル)
  - https://cdn-au.onetrust.com/consent/019bb67d-0ed6-7301-a02e-5a77018a8e00/OtAutoBlock.js (200, 6020 bytes): category
    - =k.Tag.indexOf(d)||(g=k)}}return g}(a,G);return e.CategoryId&&(c=e.CategoryId),e.Vendor&&(b=e.Vendor.split(":")),!e.Tag&&H&&(b=c=f
  - https://cdn-au.onetrust.com/scripttemplates/otSDKStub.js (200, 26819 bytes): api
    - on"==typeof s.win.__gpp||(s.win.__gpp=s.executeGppApi,window.addEventListener("message",s.messageHandler,!1),s.addFrame(s.LOCATOR_
  - https://granbluefantasy.com/_app/immutable/entry/app.Cb-0uWdr.js (200, 11183 bytes): news, archive, category
    - ","../assets/LowerLayout.Cb4DAURt.css","../chunks/news_text_16.JqEfOfoW.js","../chunks/modal.D_6fvLGM.js","../assets/modal.BrBh0gO
    - 1],"/interview/[id]":[12],"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choi
    - ,"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choices":[18],"/privacy":[17]

## Playwrightレンダリング後DOM

- 判定: 未実行
- 理由: Playwright の読み込みまたはブラウザ起動に失敗したため。必要な場合は dev dependency、ブラウザ、OS依存ライブラリを導入してから再実行する。
- エラー: browserType.launch: Target page, context or browser has been closed
- lddで検出した不足ライブラリ:
  - libasound.so.2
  - libnspr4.so
  - libnss3.so
  - libnssutil3.so
  - libsmime3.so
## スクリプト実行方法

```bash
node scripts/investigateOfficialNews.mjs
```

Playwright項目まで確認する場合は、プロジェクトに Playwright を導入した状態で同じコマンドを実行する。

