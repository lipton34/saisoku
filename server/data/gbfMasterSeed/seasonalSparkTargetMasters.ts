import { GbfMasterKind, type GbfMasterSeedItem } from "./types.js";

type SeasonalDefinition = { sourceId: string; name: string; element: string; category: string; weapon: string };

const seasonalDefinitions: SeasonalDefinition[] = [
  { sourceId: "570782", name: "グウィン(浴衣)", element: "風", category: "浴衣", weapon: "炸華紋" },
  { sourceId: "570781", name: "ヨウ(水着)", element: "水", category: "水着", weapon: "愛沿之浮袋" },
  { sourceId: "568402", name: "アートマン(水着)", element: "火", category: "水着", weapon: "エキサイトバナーナ" },
  { sourceId: "568397", name: "オシリス(浴衣)", element: "闇", category: "浴衣", weapon: "冥絡の花傘" },
  { sourceId: "565797", name: "エウロペ(ドレスアップ)", element: "光", category: "ドレスアップ", weapon: "エンゲージ･スノウピース" },
  { sourceId: "565796", name: "メグ&まりっぺ(ドレスアップ)", element: "風", category: "ドレスアップ", weapon: "マリッジシャークベル" },
  { sourceId: "547954", name: "アリア(浴衣)", element: "水", category: "浴衣", weapon: "蕣花透扇" },
  { sourceId: "547931", name: "アンスリア(水着)", element: "光", category: "水着", weapon: "サンセットライドリークス" },
  { sourceId: "547955", name: "ユーステス(浴衣)", element: "火", category: "浴衣", weapon: "ファイヤーワークスバンカー" },
  { sourceId: "547944", name: "アポロニア(水着)", element: "土", category: "水着", weapon: "海の神秘" },
  { sourceId: "534768", name: "マリアテレサ(クリスマス)", element: "火", category: "クリスマス", weapon: "ヴォラン・プニャーレ" },
  { sourceId: "534767", name: "ゼタ(クリスマス)", element: "闇", category: "クリスマス", weapon: "フロストイヴスピア" },
  { sourceId: "531252", name: "ベンヌ(クリスマス)", element: "土", category: "クリスマス", weapon: "シャジャラ・ジン" },
  { sourceId: "531251", name: "ラインハルザ(クリスマス)", element: "土", category: "クリスマス", weapon: "追熟の烈酒" },
  { sourceId: "524440", name: "エッセル(ハロウィン)", element: "水", category: "ハロウィン", weapon: "ピストレア・ブーケ" },
  { sourceId: "524439", name: "ランスロット(ハロウィン)", element: "風", category: "ハロウィン", weapon: "とんがり帽子の黒猫" },
  { sourceId: "524435", name: "ヴァジラ(ハロウィン)", element: "光", category: "ハロウィン", weapon: "第十一戌行袋爪" },
  { sourceId: "512603", name: "ハーゼリーラ(水着)", element: "風", category: "水着", weapon: "ムーンショテル" },
  { sourceId: "512602", name: "シャトラ(水着)", element: "闇", category: "水着", weapon: "第二丑行浮輪" },
  { sourceId: "512091", name: "リッチ(水着)", element: "土", category: "水着", weapon: "ブラインド・アンド･ストレイン" },
  { sourceId: "512089", name: "カシウス(水着)", element: "風", category: "水着", weapon: "海の家のラーメン" },
  { sourceId: "507506", name: "コルワ(浴衣)", element: "光", category: "浴衣", weapon: "ハッピーエンドクィル" },
  { sourceId: "507504", name: "アトゥム(水着)", element: "火", category: "水着", weapon: "ハーリク・シャーティ" },
  { sourceId: "505937", name: "フラウ(ドレスアップ)", element: "土", category: "ドレスアップ", weapon: "シェヘラザード" },
  { sourceId: "505935", name: "イルザ(ドレスアップ)", element: "水", category: "ドレスアップ", weapon: "ブライドキーパー" },
  { sourceId: "491855", name: "ビカラ(浴衣)", element: "光", category: "浴衣", weapon: "第一子行弾弓" },
  { sourceId: "489325", name: "シエテ(浴衣)", element: "闇", category: "浴衣", weapon: "七彩華刀" },
  { sourceId: "490119", name: "ルオー(水着)", element: "土", category: "水着", weapon: "ルオー･フロート" },
  { sourceId: "489328", name: "マキラ(水着)", element: "風", category: "水着", weapon: "第十酉行筒" },
  { sourceId: "485115", name: "ロベリア(バレンタイン)", element: "闇", category: "バレンタイン", weapon: "ドゥルール･クラポティ" },
  { sourceId: "485114", name: "マコラ(バレンタイン)", element: "土", category: "バレンタイン", weapon: "第四卯行突匙" },
  { sourceId: "478819", name: "カトル(クリスマス)", element: "火", category: "クリスマス", weapon: "デコル・シカリウス" },
  { sourceId: "478820", name: "ゾーイ(クリスマス)", element: "光", category: "クリスマス", weapon: "均衡の聖杖" },
  { sourceId: "476052", name: "ユグドラシル(クリスマス)", element: "闇", category: "クリスマス", weapon: "サンクトリア" },
  { sourceId: "476053", name: "ワムデュス(クリスマス)", element: "火", category: "クリスマス", weapon: "ワムデュス・サンタ" },
  { sourceId: "468413", name: "ウィルナス(ハロウィン)", element: "光", category: "ハロウィン", weapon: "ウィルナス・オー・ランタン" },
  { sourceId: "468422", name: "マナマル(ハロウィン)", element: "土", category: "ハロウィン", weapon: "スウィートサプライズ" },
  { sourceId: "468412", name: "サテュロス(ハロウィン)", element: "闇", category: "ハロウィン", weapon: "タオタオ・フー" },
  { sourceId: "460523", name: "ニーア(浴衣)", element: "水", category: "浴衣", weapon: "愛々傘" },
  { sourceId: "458528", name: "アグロヴァル(浴衣)", element: "火", category: "浴衣", weapon: "白氷碧扇" },
  { sourceId: "458527", name: "ガレヲン(水着)", element: "風", category: "水着", weapon: "ガレヲン・フロート" },
  { sourceId: "458159", name: "ソーン(浴衣)", element: "火", category: "浴衣", weapon: "燦花" },
  { sourceId: "458179", name: "ラガッツォ(水着)", element: "光", category: "水着", weapon: "ソーレ・インテンソ" },
  { sourceId: "458174", name: "ヘカテー(水着)", element: "闇", category: "水着", weapon: "アマラントス" },
  { sourceId: "457004", name: "ハレゼナ(水着)", element: "闇", category: "水着", weapon: "守畏禍棒" },
  { sourceId: "457006", name: "ククル(水着)", element: "光", category: "水着", weapon: "バカンス・ツールボックス" },
  { sourceId: "455442", name: "テフヌト(水着)", element: "水", category: "水着", weapon: "ダルドゥール" },
  { sourceId: "455441", name: "ラジエル(水着)", element: "土", category: "水着", weapon: "アルトリエ" },
  { sourceId: "440206", name: "レフィーエ(浴衣)", element: "闇", category: "浴衣", weapon: "ディアマントフルレ" },
  { sourceId: "440208", name: "エルモート(浴衣)", element: "火", category: "浴衣", weapon: "サマーナイト・ブレイズ" },
  { sourceId: "441124", name: "メイガス(水着)", element: "闇", category: "水着", weapon: "ビヨンド・ザ・ディマイズ" },
  { sourceId: "441131", name: "ホルス(水着)", element: "光", category: "水着", weapon: "ウアス・セプトラ" },
  { sourceId: "436865", name: "ネハン(バレンタイン)", element: "火", category: "バレンタイン", weapon: "ラカン" },
  { sourceId: "436867", name: "シンダラ(バレンタイン)", element: "闇", category: "バレンタイン", weapon: "第三双寅行弓" },
  { sourceId: "430460", name: "ノア(クリスマス)", element: "火", category: "クリスマス", weapon: "オーナメントパドル" },
  { sourceId: "430461", name: "シャレム(クリスマス)", element: "土", category: "クリスマス", weapon: "バブ・ベル・ランデヴ" },
  { sourceId: "427493", name: "イルノート(クリスマス)", element: "光", category: "クリスマス", weapon: "ブロックバスター" },
  { sourceId: "427494", name: "ユニ(クリスマス)", element: "闇", category: "クリスマス", weapon: "ノクスミーティア" },
  { sourceId: "422569", name: "ダーント(ハロウィン)", element: "土", category: "ハロウィン", weapon: "スプーキー・ミュー" },
  { sourceId: "422572", name: "ティコ(ハロウィン)", element: "闇", category: "ハロウィン", weapon: "シリンジ・オア・トリート" },
  { sourceId: "422568", name: "ビカラ(ハロウィン)", element: "水", category: "ハロウィン", weapon: "第一子行霊杖" },
  { sourceId: "411525", name: "セルエル(水着)", element: "光", category: "水着", weapon: "盛夏と休息の剣" },
  { sourceId: "411522", name: "アニラ(浴衣)", element: "水", category: "浴衣", weapon: "第八綿羊行太刀" },
  { sourceId: "411521", name: "ヴァンピィ(浴衣)", element: "風", category: "浴衣", weapon: "夏の宵･紫陽" },
  { sourceId: "410784", name: "ユリウス(水着)", element: "光", category: "水着", weapon: "テンタクルジャベリン" },
  { sourceId: "410785", name: "ドロクラ(水着)", element: "火", category: "水着", weapon: "ブライト＆サイレンス" },
  { sourceId: "410764", name: "アリーザ(水着)", element: "風", category: "水着", weapon: "サンセットブレイズ" },
  { sourceId: "410765", name: "フェディエル(水着)", element: "水", category: "水着", weapon: "フェディエル･フロート" },
  { sourceId: "408890", name: "バザラガ(水着)", element: "水", category: "水着", weapon: "ビーチ･グロウノス" },
  { sourceId: "408889", name: "エニュオ(水着)", element: "火", category: "水着", weapon: "スプラッシュハウル" },
  { sourceId: "406556", name: "フォリア(浴衣)", element: "土", category: "浴衣", weapon: "富嶽景弓" },
  { sourceId: "406555", name: "クピタン(水着)", element: "闇", category: "水着", weapon: "シーオブドリーム" },
  { sourceId: "390417", name: "ナタク(浴衣)", element: "火", category: "浴衣", weapon: "綉毬" },
  { sourceId: "390418", name: "イルザ(浴衣)", element: "闇", category: "浴衣", weapon: "白芍巾着" },
  { sourceId: "390415", name: "アズサ(水着)", element: "闇", category: "水着", weapon: "紫梓想憧" },
  { sourceId: "390416", name: "モニカ(水着)", element: "光", category: "水着", weapon: "マリンエース" },
  { sourceId: "385102", name: "セン(バレンタイン)", element: "水", category: "バレンタイン", weapon: "バウロキャッツハンド" },
  { sourceId: "385100", name: "サンダルフォン(バレンタイン)", element: "風", category: "バレンタイン", weapon: "想い出の珈琲車厘" },
  { sourceId: "379974", name: "カイン(クリスマス)", element: "火", category: "クリスマス", weapon: "ストロベリースイング" },
  { sourceId: "379973", name: "シャトラ(クリスマス)", element: "水", category: "クリスマス", weapon: "第二丑行柔爪" },
  { sourceId: "377607", name: "フィオリト(クリスマス)", element: "闇", category: "クリスマス", weapon: "エキササイズ・リース" },
  { sourceId: "377606", name: "エウロペ(クリスマス)", element: "土", category: "クリスマス", weapon: "セイントファウンテン" },
  { sourceId: "367678", name: "フロレンス(ハロウィン)", element: "光", category: "ハロウィン", weapon: "フィーストシグナ" },
  { sourceId: "367677", name: "ムゲン(ハロウィン)", element: "光", category: "ハロウィン", weapon: "ニオウ" },
  { sourceId: "367676", name: "リッチ(ハロウィン)", element: "風", category: "ハロウィン", weapon: "トリート･アンド･ストレイン" },
  { sourceId: "359333", name: "闇ジャンヌ(水着)", element: "水", category: "水着", weapon: "ミスティーク" },
  { sourceId: "355008", name: "スツルム(水着)", element: "光", category: "水着", weapon: "シースフィア" },
  { sourceId: "355005", name: "ティコ(水着)", element: "土", category: "水着", weapon: "サマーヒーリング" },
  { sourceId: "354027", name: "ユーステス(水着)", element: "風", category: "水着", weapon: "バブルガムバンカー" },
  { sourceId: "354024", name: "マギサ(水着)", element: "闇", category: "水着", weapon: "プルメリアンセプター" },
  { sourceId: "354026", name: "クラリス(水着)", element: "水", category: "水着", weapon: "オーシャンクライン" },
  { sourceId: "352080", name: "シオン(水着)", element: "風", category: "水着", weapon: "散沙牡丹･夕時雨" },
  { sourceId: "352083", name: "ミリン(水着)", element: "火", category: "水着", weapon: "晴風番傘･花緑青" },
  { sourceId: "348695", name: "ビカラ(水着)", element: "土", category: "水着", weapon: "第一子行鞭" },
  { sourceId: "348694", name: "ヴァジラ(水着)", element: "闇", category: "水着", weapon: "第十一戌行刃" },
  { sourceId: "322593", name: "シルヴァ(浴衣)", element: "火", category: "浴衣", weapon: "コルクバレットシューター" },
  { sourceId: "322587", name: "ナルメア(浴衣)", element: "光", category: "浴衣", weapon: "鬼切安綱" },
  { sourceId: "322610", name: "メドゥーサ(水着)", element: "火", category: "水着", weapon: "メドゥシアナ･フロート" },
  { sourceId: "318916", name: "ファスティバ(バレンタイン)", element: "光", category: "バレンタイン", weapon: "ハートビートミトン" },
  { sourceId: "318914", name: "ヴィーラ(バレンタイン)", element: "火", category: "バレンタイン", weapon: "アルカン･ルージュ" },
  { sourceId: "318912", name: "カシウス(バレンタイン)", element: "水", category: "バレンタイン", weapon: "マリトッツォ" },
  { sourceId: "311623", name: "アルタイル(クリスマス)", element: "火", category: "クリスマス", weapon: "六韜軍配" },
  { sourceId: "311624", name: "マキラ(クリスマス)", element: "光", category: "クリスマス", weapon: "第十酉行杖" },
  { sourceId: "309902", name: "アンスリア(クリスマス)", element: "土", category: "クリスマス", weapon: "サイレントナイトリークス" },
  { sourceId: "298928", name: "ヴェイン(ハロウィン)", element: "風", category: "ハロウィン", weapon: "クリーピィクロウ" },
  { sourceId: "298927", name: "ククル(ハロウィン)", element: "土", category: "ハロウィン", weapon: "ノーティーウィッチ" },
  { sourceId: "290235", name: "シヴァ(水着)", element: "光", category: "水着", weapon: "究極不変のダイアグラム" },
  { sourceId: "290236", name: "シャレム(水着)", element: "水", category: "水着", weapon: "ゾディアコ･ヴィテ" },
  { sourceId: "290232", name: "タヴィーナ(水着)", element: "闇", category: "水着", weapon: "タアロ･マサラ" },
  { sourceId: "290231", name: "ザルハメリナ(浴衣)", element: "光", category: "浴衣", weapon: "日輪橙音" },
  { sourceId: "289395", name: "メーテラ(水着)", element: "土", category: "水着", weapon: "マリンエーテリアル" },
  { sourceId: "289391", name: "メグ(水着)", element: "闇", category: "水着", weapon: "ウルスラグローブ" },
  { sourceId: "287848", name: "イルノート(水着)", element: "土", category: "水着", weapon: "バブルレター" },
  { sourceId: "287846", name: "ジーク(水着)", element: "水", category: "水着", weapon: "ブルータル･ハープーン" },
  { sourceId: "285936", name: "イシュミール(浴衣)", element: "火", category: "浴衣", weapon: "瑠璃茉莉髪帯" },
  { sourceId: "285932", name: "イングヴェイ(浴衣)", element: "風", category: "浴衣", weapon: "セ･ラ･ヴィ" },
  { sourceId: "260547", name: "クビラ(水着)", element: "火", category: "水着", weapon: "第十二猪行槍" },
  { sourceId: "260546", name: "アンチラ(水着)", element: "水", category: "水着", weapon: "第九申行棒" },
  { sourceId: "256075", name: "アグロヴァル(バレンタイン)", element: "光", category: "バレンタイン", weapon: "グラナード･オブ･ウェールズ" },
  { sourceId: "256077", name: "モニカ(バレンタイン)", element: "土", category: "バレンタイン", weapon: "ラブリーエース" },
  { sourceId: "246402", name: "リリィ(クリスマス)", element: "光", category: "クリスマス", weapon: "セイントクリスタル" },
  { sourceId: "244511", name: "ミリン(クリスマス)", element: "水", category: "クリスマス", weapon: "ユキハネ" },
  { sourceId: "244510", name: "ネモネ(クリスマス)", element: "火", category: "クリスマス", weapon: "トロピカルウィンター" },
  { sourceId: "233459", name: "ロゼッタ(ハロウィン)", element: "水", category: "ハロウィン", weapon: "ブラックローズ" },
  { sourceId: "233457", name: "アザゼル(ハロウィン)", element: "火", category: "ハロウィン", weapon: "トリックサーペント" },
  { sourceId: "221376", name: "ミムルメモル(水着)", element: "火", category: "水着", weapon: "ミムメモ人形" },
  { sourceId: "221375", name: "シルヴァ(水着)", element: "土", category: "水着", weapon: "ヴリスラグナ･サンドカモ" },
  { sourceId: "221374", name: "アルベール(水着)", element: "風", category: "水着", weapon: "ライトニング・サヴァイヴ" },
  { sourceId: "219299", name: "アニラ(水着)", element: "風", category: "水着", weapon: "第八綿羊行刃" },
  { sourceId: "219298", name: "ロザミア(浴衣)", element: "光", category: "浴衣", weapon: "与力十手" },
  { sourceId: "216117", name: "アーミラ(水着)", element: "闇", category: "水着", weapon: "サマージェネシス" },
  { sourceId: "216120", name: "ルシオ(水着)", element: "水", category: "水着", weapon: "暁" },
  { sourceId: "212699", name: "コルル(水着)", element: "水", category: "水着", weapon: "暇無し" },
  { sourceId: "189683", name: "ティナ(水着)", element: "火", category: "水着", weapon: "トロピカルフェアリー" },
  { sourceId: "186873", name: "グリームニル(バレンタイン)", element: "風", category: "バレンタイン", weapon: "ルペルカリア" },
  { sourceId: "186872", name: "スカーサハ(バレンタイン)", element: "火", category: "バレンタイン", weapon: "ディアドリックハート" },
  { sourceId: "180272", name: "セルエル(クリスマス)", element: "風", category: "クリスマス", weapon: "誓いと洗礼の剣" },
  { sourceId: "180271", name: "ナルメア(クリスマス)", element: "土", category: "クリスマス", weapon: "清めと祓いの刃" },
  { sourceId: "178713", name: "ミュオン(クリスマス)", element: "風", category: "クリスマス", weapon: "レイガン" },
  { sourceId: "178714", name: "マギサ(クリスマス)", element: "土", category: "クリスマス", weapon: "ホーリーナイトセプター" },
  { sourceId: "172848", name: "ハレゼナ(ハロウィン)", element: "光", category: "ハロウィン", weapon: "スピリットシーカー" },
  { sourceId: "172847", name: "ゼタ&バザラガ(ハロウィン)", element: "土", category: "ハロウィン", weapon: "ウィッチブルーム" },
  { sourceId: "161175", name: "ブローディア(水着)", element: "土", category: "水着", weapon: "ニーベルングラス" },
  { sourceId: "161244", name: "アンスリア(浴衣)", element: "闇", category: "浴衣", weapon: "サマーメモリーリークス" },
  { sourceId: "160378", name: "ジェシカ(浴衣)", element: "土", category: "浴衣", weapon: "蒼宵光華" },
  { sourceId: "160256", name: "エウロペ(水着)", element: "水", category: "水着", weapon: "クリスタルベルフラワー" },
  { sourceId: "158966", name: "カリオストロ(水着)", element: "水", category: "水着", weapon: "オンリー･プリティ･ガール" },
  { sourceId: "156396", name: "ハールート･マールート(水着)", element: "光", category: "水着", weapon: "レター" },
  { sourceId: "156397", name: "サンダルフォン(水着)", element: "水", category: "水着", weapon: "アイン･ソフ" },
  { sourceId: "145005", name: "ユエル(水着)", element: "風", category: "水着", weapon: "蒼紅之華刀" },
  { sourceId: "142323", name: "メリッサベル(バレンタイン)", element: "光", category: "バレンタイン", weapon: "ソードコーン" },
  { sourceId: "142324", name: "クラリス(バレンタイン)", element: "闇", category: "バレンタイン", weapon: "シルフィウム" },
  { sourceId: "134572", name: "メーテラ(クリスマス)", element: "光", category: "クリスマス", weapon: "ピンキーニードル" },
  { sourceId: "123860", name: "レディ･グレイ(ハロウィン)", element: "闇", category: "ハロウィン", weapon: "ディスタント･レクイエム" },
  { sourceId: "116715", name: "グレア(水着)", element: "水", category: "水着", weapon: "ドラグホーン" },
  { sourceId: "113296", name: "ノイシュ(水着)", element: "光", category: "水着", weapon: "コニファラス" },
  { sourceId: "113295", name: "イルザ(水着)", element: "火", category: "水着", weapon: "アルジュナン・ボウ" },
  { sourceId: "113294", name: "ロゼッタ(水着)", element: "土", category: "水着", weapon: "トーニーローズ" },
  { sourceId: "95564", name: "ジャンヌダルク(水着)", element: "風", category: "水着", weapon: "オルレアン･フラッグ" },
  { sourceId: "92262", name: "メドゥーサ(バレンタイン)", element: "土", category: "バレンタイン", weapon: "メドゥシアナ★ステッキ" },
  { sourceId: "84295", name: "マリー(クリスマス)", element: "光", category: "クリスマス", weapon: "セイントスタークラッカー" },
  { sourceId: "74507", name: "ダヌア(ハロウィン)", element: "火", category: "ハロウィン", weapon: "スナックポール" },
  { sourceId: "65463", name: "ディアンサ(水着)", element: "水", category: "水着", weapon: "トレピリ" },
  { sourceId: "64636", name: "ジークフリート(浴衣)", element: "風", category: "浴衣", weapon: "シネンシス" },
  { sourceId: "63723", name: "イシュミール(水着)", element: "水", category: "水着", weapon: "パーマフロスト・ソード" },
  { sourceId: "62694", name: "コルワ(水着)", element: "風", category: "水着", weapon: "ハッピーエンドベル" },
  { sourceId: "51675", name: "ベアトリクス(水着)", element: "火", category: "水着", weapon: "デルタ・クォーツ" },
  { sourceId: "46637", name: "アルルメイヤ(クリスマス)", element: "水", category: "クリスマス", weapon: "星屑の聖杖" },
  { sourceId: "43615", name: "ユーステス(ハロウィン)", element: "土", category: "ハロウィン", weapon: "ナイトメアバンカー" },
  { sourceId: "35539", name: "ヘルエス(水着)", element: "光", category: "水着", weapon: "クリスタルルーン" },
  { sourceId: "35482", name: "パーシヴァル(水着)", element: "火", category: "水着", weapon: "アントウェルペン" },
  { sourceId: "35289", name: "ナルメア(水着)", element: "水", category: "水着", weapon: "雷切" },
  { sourceId: "21258", name: "クラリス(クリスマス)", element: "土", category: "クリスマス", weapon: "スノウリィメビウス" },
  { sourceId: "21263", name: "カリオストロ(ハロウィン)", element: "闇", category: "ハロウィン", weapon: "トリート･ウロボロス" },
  { sourceId: "21269", name: "ゼタ(水着)", element: "光", category: "水着", weapon: "クレティネ" },
  { sourceId: "21271", name: "ダヌア(水着)", element: "闇", category: "水着", weapon: "三日月" },
  { sourceId: "21274", name: "ヴィーラ(水着)", element: "土", category: "水着", weapon: "ディープデザイア" },
  { sourceId: "21044", name: "ロゼッタ(クリスマス)", element: "闇", category: "クリスマス", weapon: "ローゼンメイデン" },
  { sourceId: "21288", name: "シャルロッテ(ハロウィン)", element: "光", category: "ハロウィン", weapon: "トリック･オア･トリート" },
  { sourceId: "21287", name: "イオ(水着)", element: "火", category: "水着", weapon: "サンフラワーワンド" },
  { sourceId: "21054", name: "レフィーエ(水着)", element: "光", category: "水着", weapon: "ダイヤモンドエッジ" },
];

function normalized(value: string) {
  return value.normalize("NFKC").replace(/[・･\s]/g, "").replace(/ドレス(?=\))/g, "ドレスアップ");
}

const existingCharacterIdsBySourceId: Record<string, string> = {
  "441124": "char-magus-summer",
  "410785": "char-dorothy-and-claudia-summer",
  "359333": "char-jeanne-darc-water-summer",
  "290236": "char-shalem-summer",
  "287846": "char-siegfried-summer",
  "95564": "char-jeanne-darc-summer",
};

export function applySeasonalSparkTargetMasters(items: GbfMasterSeedItem[]) {
  const result = [...items];
  const characters = result.filter((item) => item.kind === GbfMasterKind.character);
  const weapons = result.filter((item) => item.kind === GbfMasterKind.weapon);
  for (const definition of seasonalDefinitions) {
    const existingCharacterId = existingCharacterIdsBySourceId[definition.sourceId];
    const character = characters.find((item) =>
      (existingCharacterId ? item.id === existingCharacterId : normalized(item.name) === normalized(definition.name))
      && item.element === definition.element
    );
    const characterId = character?.id ?? "char-seasonal-" + definition.sourceId;
    const weapon = weapons.find((item) => normalized(item.name) === normalized(definition.weapon));
    const weaponId = weapon?.id ?? "weapon-seasonal-" + definition.sourceId;
    const characterData = { acquisitionGroup: "seasonal", seasonalCategory: definition.category, unlockWeaponId: weaponId };
    const weaponData = { acquisitionGroup: "seasonal", seasonalCategory: definition.category, unlockCharacterId: characterId };
    if (character) {
      Object.assign(character, { category: definition.category, tags: [...new Set([...(character.tags ?? []), "限定", "季節限定", definition.category])], metadata: { ...(character.metadata ?? {}), ...characterData } });
    } else {
      const created: GbfMasterSeedItem = { id: characterId, kind: GbfMasterKind.character, name: definition.name, element: definition.element, rarity: "SSR", category: definition.category, tags: ["限定", "季節限定", definition.category], metadata: characterData };
      result.push(created); characters.push(created);
    }
    if (weapon) {
      Object.assign(weapon, { category: definition.category + "解放武器", tags: [...new Set([...(weapon.tags ?? []), "限定", "季節限定", definition.category])], metadata: { ...(weapon.metadata ?? {}), ...weaponData } });
    } else {
      const created: GbfMasterSeedItem = { id: weaponId, kind: GbfMasterKind.weapon, name: definition.weapon, element: definition.element, rarity: "SSR", category: definition.category + "解放武器", tags: ["限定", "季節限定", definition.category], metadata: weaponData };
      result.push(created); weapons.push(created);
    }
  }
  return result;
}

export { seasonalDefinitions };
 
