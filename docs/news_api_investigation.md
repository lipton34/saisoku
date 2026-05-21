# 公式NEWS rcms-api 調査結果

生成日時: 2026-05-21T09:59:17.139Z

## 方針

- 公式本文全文、公式画像、HTML全文、JSON全文は保存しない。
- 保存するのは検出件数、URL、キー名、短い確認用スニペット、判定のみ。
- APIアクセスは確認済み候補に対する少数リクエストに限定し、総当たりは行わない。
- 本調査は本実装前の取得可否確認であり、常時スクレイピング機能ではない。

## 結論

1. rcms-api の base URL: https://granbluefantasy.com/rcms-api
2. NEWS一覧取得API: 確認できた
3. カテゴリ別NEWS取得API: 確認できた
4. 月別アーカイブ取得API: 確認できた
5. 記事詳細取得API: 確認できた
6. 本実装に使えそうか: 使えそう。Playwrightなしで rcms-api 直接取得を優先できる。
7. Playwrightを本実装に使う必要: 現時点では不要。API障害時の手動調査・検証用に留めるのがよい。

## JS調査

- 対象ページ数: 6
- 取得JS数: 80
- news/archive/category/api/rcms-api を含むJS数: 24
- API base URL候補: https://granbluefantasy.com/rcms-api

### 関連JSファイル

- https://cdn-au.onetrust.com/consent/019bb67d-0ed6-7301-a02e-5a77018a8e00/OtAutoBlock.js (6020 bytes): category
  - ng(l),""):m);!d||-1===d.indexOf(F)&&-1===k.Tag.indexOf(d)||(g=k)}}return g}(a,G);return e.CategoryId&&(c=e.CategoryId),e.Vendor&&(b=e.Vendor.split(":")),!e.Tag&&H&&(b=c=function(d){var h=[],g=function(f){var k=document.c...
- https://cdn-au.onetrust.com/scripttemplates/otSDKStub.js (26819 bytes): api
  - his.init=function(){s.win.__gpp&&"function"==typeof s.win.__gpp||(s.win.__gpp=s.executeGppApi,window.addEventListener("message",s.messageHandler,!1),s.addFrame(s.LOCATOR_NAME))},this.removeGppApi=function(){delete s.win....
- https://granbluefantasy.com/_app/immutable/entry/app.Cb-0uWdr.js (11183 bytes): news, archive, category
  - .css","../chunks/LowerLayout.ll3zLl2B.js","../assets/LowerLayout.Cb4DAURt.css","../chunks/news_text_16.JqEfOfoW.js","../chunks/modal.D_6fvLGM.js","../assets/modal.BrBh0gOp.css","../assets/2.CP1L5gfc.css","../assets/news....
  - d]":[9],"/download":[10],"/interview":[11],"/interview/[id]":[12],"/news":[13,[2]],"/news/archive":[15,[2]],"/news/category":[16,[2]],"/news/[id]":[14,[2]],"/privacy-choices":[18],"/privacy":[17],"/release_campaign":[19]...
- https://granbluefantasy.com/_app/immutable/nodes/0.C58OBAER.js (17240 bytes): news, api
  - ),te=p(()=>L().route.id);let Y=Fe(null);const J=p(()=>s.data.currentLang),q=p(()=>[{key:r.NEWS,path:g()[r.NEWS].path,label:ze()},{key:r.WORLD,path:g()[r.WORLD].path,label:Ke()},{key:r.CHARACTER,path:g()[r.CHARACTER].path...
  - B,_=>{e(m)&&_(b)})}l(y,C),Pe()}var _t=v(' <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wg
- https://granbluefantasy.com/_app/immutable/chunks/page_settings.CQaITPUw.js (7445 bytes): news, api, rcms-api
  - n={},e={})=>{const t=e.locale??a();return t==="ja"?O():t==="en"?S():"cmn_text_21"},x=()=>"News | グランブルーファンタジー公式サイト | Cygames",W=x,P=(n={},e={})=>{const t=e.locale??a();return t==="ja"?x():t==="en"?W():"cmn_text_22"},d=()...
  - https://granbluefantasy.g.kuroco-img.app/files/user",Wt="https://granbluefantasy.com/rcms-api",Pt="https://granbluefantasy.com",m=()=>"ぐらぶるちゃんねるっ！",h=m,A=(n={},e={})=>{const t=e.locale??a();return t==="ja"?m():t==="en"?h...
- https://granbluefantasy.com/_app/immutable/chunks/characters._q_eOlQW.js (14180 bytes): api
  - > A girl shrouded in mystery, able to control mighty primal beasts. After escaping capitivity in the Erste Empire with Katalina's help, her fate would soon become intertwined with the main character's. Brimming with curi...
- https://granbluefantasy.com/_app/immutable/chunks/EnhancedImg.D9XRlUQt.js (611892 bytes): news, category, api
  - Xs1TG.jpeg",import.meta.url).href,w:2880,h:1600}},B2={sources:{avif:""+new URL("../assets/news_frame.CnQJO83U.avif",import.meta.url).href+" 1000w, "+new URL("../assets/news_frame.C_33XwfV.avif",import.meta.url).href+" 20...
  - /modal_frame.svg":pi,"/src/lib/images/sp/news/blank.svg":wi,"/src/lib/images/sp/news/news_category_close.svg":_i,"/src/lib/images/sp/news/news_common_arw.svg":gi,"/src/lib/images/sp/news/news_decoimg-L.svg":ci,"/src/lib/...
- https://granbluefantasy.com/_app/immutable/chunks/official_links.zi_xhgwa.js (3064 bytes): api
  - ular:"app_andapp.png",small:"app_andapp.png"}}},dmm:{url:{ja:{pc:"https://rcv.ixd.dmm.com/api/surl?urid=hv2GjfyD",sp:"https://rcv.ixd.dmm.com/api/surl?urid=ehEWAR0G"},en:{pc:"https://rcv.ixd.dmm.com/api/surl?urid=hv2Gjfy...
- https://granbluefantasy.com/_app/immutable/chunks/cmn_footer_note.DBpiJZ-w.js (1964 bytes): news
  - import{g as e}from"./runtime.C1AkxtCQ.js";const c=()=>"News",o=()=>"News",D=(r={},n={})=>{const t=n.locale??e();return t==="ja"?c():t==="en"?o():"cmn_text_1"},_=()=>"World",a=()=>"World",I=(r={},n={})=>{const t=n.lo
- https://granbluefantasy.com/_app/immutable/nodes/2.B60Bvuzu.js (9085 bytes): news, archive, category, api
  - l3zLl2B.js";import{n as Re,a as $e,b as Te,c as je,d as Ye,e as pe,f as Be}from"../chunks/news_text_16.JqEfOfoW.js";import{c as He,m as ge,d as Ke}from"../chunks/utils.G1AaydLl.js";import{M as Fe,a as Ge}from"../chunks/m...
  - -menu__item-inner svelte-6zq3cg"> '),Ze=(G,h,O)=>h(Number(O())),ea=m(' '),aa=m('
- https://granbluefantasy.com/_app/immutable/chunks/Loading.YdM98o5y.js (2228 bytes): api
  - roco-img\.app/g,B),JSON.parse(s)})}getContents(t,n=fetch){this.fetcher=n;const{endpoint:r,apiId:c,...h}=t;return this._fetch(r,c,h)}getContent(t,n=fetch){this.fetcher=n;const{endpoint:r,apiId:c,contentId:h,...a}=t;return...
- https://granbluefantasy.com/_app/immutable/chunks/news_text_16.JqEfOfoW.js (963 bytes): news
  - import{g as n}from"./runtime.C1AkxtCQ.js";const c=()=>"NEWS",a=()=>"NEWS",S=(s={},e={})=>{const t=e.locale??n();return t==="ja"?c():t==="en"?a():"news_text_1"},u=()=>"カテゴリ",l=()=>"Categories",b=(s={},e={})=>{const t
- https://granbluefantasy.com/_app/immutable/nodes/13.BZCUfzCv.js (5456 bytes): news, category, api
  - n.js";import{P as Ha}from"../chunks/Pagination.D00fqGqc.js";import{n as Qa}from"../chunks/news_text_10.Dpv8ZGJo.js";const ga=da().NEWS.supportedLangs,ma=!ga||ga.includes(ka()),Wa=ma,qa=async({url:h,fetch:j,parent:T})=>{i...
  - "page");(g===null||g==="1")&&(b=C);const{layoutPromise:L}=await T(),c=h.searchParams.get("category");let O=null;if(c&&c!=="all"){let t=[];await L?.then(d=>{t=d?.categories||[],O=t.find(S=>S.slug===c)?.topics_id})}return{...
- https://granbluefantasy.com/_app/immutable/chunks/news_text_10.Dpv8ZGJo.js (191 bytes): news
  - ",s=()=>"Details",a=(o={},e={})=>{const t=e.locale??n();return t==="ja"?r():t==="en"?s():"news_text_10"};export{a as n};
- https://granbluefantasy.com/_app/immutable/nodes/16.D6TlpYFk.js (3058 bytes): news, category, api
  - rom"../chunks/ListRow._ch91WJw.js";const dt=async({url:m,fetch:s,parent:h})=>{const l=B().NEWS.supportedLangs;if(!(!l||l.includes(H())))throw F(404,"Not Found");const i=30,{layoutPromise:f}=await h(),r=m.searchParams.get...
  - load:dt},Symbol.toStringTag,{value:"Module"}));var mt=I(" "),ut=I(' </di
- https://granbluefantasy.com/_app/immutable/chunks/ListRow._ch91WJw.js (952 bytes): news, category
  - itle svelte-67qyhp"> ');function G(h,a){q(a,!0);var r=B();p(()=>z(r,"href",P(`/news/${a.slug?a.slug:a.topics_id}/`)));var i=e(r),w=e(i,!0);t(i);var l=c(i,2),f=e(l);N(f,17,()=>a.categories,j,(s,n)=>{var o=R(),b=e(o,!0);t(...
  - m"./attributes.BtKOxRrH.js";import{m as P}from"./utils.G1AaydLl.js";var R=m(' '),A=m(' New! '),B=m(' <span
- https://granbluefantasy.com/_app/immutable/nodes/15.CTBfrOAp.js (3406 bytes): news, archive, api
  - AaydLl.js";import{g as ht}from"../chunks/entry.gYHCW9Vo.js";import{n as St}from"../chunks/news_text_17.Ct9bA-NH.js";import{L as Nt}from"../chunks/ListRow._ch91WJw.js";const Et=async({url:f,fetch:i})=>{const y=H().NEWS.su...
  - isNaN(o)||o 12)return null;const p=f.searchParams.get("page")||"1",d={endpoint:"news-archive",apiId:tt,cnt:h,pageID:p,filter:T},{list:m,pageInfo:w}=await et.getContents(d,i);return{list:m,pageNo:Number(p),totalPage:Math....
- https://granbluefantasy.com/_app/immutable/chunks/news_text_17.Ct9bA-NH.js (200 bytes): news
  - 該当の記事がありません。",s=e,a=(o={},n={})=>{const t=n.locale??r();return t==="ja"?e():t==="en"?s():"news_text_17"};export{a as n};
- https://granbluefantasy.com/_app/immutable/nodes/3.CYdVRgwX.js (75642 bytes): news, category, api
  - {if(Te()==="en")return null;const a=10,[c,m]=await Promise.all([et.getContents({endpoint:"news",apiId:Ze,cnt:a,pageID:"1"},n),et.getContents({endpoint:"news-nav",apiId:Ze},n)]);return{list:c.list,pageInfo:c.pageInfo,cate...
  - unt())}))})})},e.instances=new WeakMap,e}(rt);si&&Mn.initHtmlApi();var ri=R(' '),ii=R(' New! '),oi=R(' <a class="news-l
- https://granbluefantasy.com/_app/immutable/nodes/6.Bbx34W3J.js (65289 bytes): archive
  - class="actor svelte-mqsz1k">加藤英美里 番組アーカイブ <ul class=

### JS内のAPI利用候補

- file: https://granbluefantasy.com/_app/immutable/nodes/2.B60Bvuzu.js
  - endpoint: news-nav
  - snippet: endpoint:"news-nav",apiId:Ee},{news:A,categories:b}=await Le.getContents(O,G),y=b?[...b].sort((C,R)=>{const x=he.indexOf(C.slug),i=he.indexOf(R.slug);return(x===-1?ye:x)-(i===-1?ye:i)}):[];return{news:A,categories:y||[]}}catch{return null}})()}:{listPromise:Pr...
- file: https://granbluefantasy.com/_app/immutable/nodes/2.B60Bvuzu.js
  - endpoint: news-nav
  - snippet: {endpoint:"news-nav",apiId:Ee},{news:A,categories:b}=await Le.getContents(O,G),y=b?[...b].sort((C,R)=>{const x=he.indexOf(C.slug),i=he.indexOf(R.slug);return(x===-1?ye:x)-(i===-1?ye:i)}):[];return{news:A,categories:y||[]}}catch{return null}})()}:{listPromise:P...
- file: https://granbluefantasy.com/_app/immutable/chunks/Loading.YdM98o5y.js
  - endpoint: 式/動的指定
  - snippet: {endpoint:r,apiId:c,...h}=t;return this._fetch(r,c,h)}getContent(t,n=fetch){this.fetcher=n;const{endpoint:r,apiId:c,contentId:h,...a}=t;return"preview_token"in a?this._fetch(`${r}`,c,a):this._fetch(`${r}/${h}`,c,a)}}const re=new M({serviceDomain:q});var V=Z('<...
- file: https://granbluefantasy.com/_app/immutable/nodes/13.BZCUfzCv.js
  - endpoint: news
  - snippet: endpoint:"news",apiId:Na,cnt:b,pageID:t};c&&c!=="all"&&(d.filter=`categories.module_id contains ${O}`);const{list:S,pageInfo:q}=await La.getContents(d,j);return{list:S,pageNo:Number(t),totalPage:Math.ceil(q.totalCnt/b)}}catch{return null}})()}},ws=Object.freez...
- file: https://granbluefantasy.com/_app/immutable/nodes/13.BZCUfzCv.js
  - endpoint: news
  - snippet: {endpoint:"news",apiId:Na,cnt:b,pageID:t};c&&c!=="all"&&(d.filter=`categories.module_id contains ${O}`);const{list:S,pageInfo:q}=await La.getContents(d,j);return{list:S,pageNo:Number(t),totalPage:Math.ceil(q.totalCnt/b)}}catch{return null}})()}},ws=Object.free...
- file: https://granbluefantasy.com/_app/immutable/nodes/16.D6TlpYFk.js
  - endpoint: categorized-news
  - snippet: endpoint:"categorized-news",apiId:G,cnt:i,pageID:e};r&&r!=="all"&&(a.filter=`categories.module_id contains ${n}`);const{list:o,pageInfo:p}=await Q.getContents(a,s);return{list:o,pageNo:Number(e),totalPage:Math.ceil(p.totalCnt/i)}}catch{return null}})()}},Ft=Ob...
- file: https://granbluefantasy.com/_app/immutable/nodes/16.D6TlpYFk.js
  - endpoint: categorized-news
  - snippet: {endpoint:"categorized-news",apiId:G,cnt:i,pageID:e};r&&r!=="all"&&(a.filter=`categories.module_id contains ${n}`);const{list:o,pageInfo:p}=await Q.getContents(a,s);return{list:o,pageNo:Number(e),totalPage:Math.ceil(p.totalCnt/i)}}catch{return null}})()}},Ft=O...
- file: https://granbluefantasy.com/_app/immutable/nodes/15.CTBfrOAp.js
  - endpoint: news-archive
  - snippet: endpoint:"news-archive",apiId:tt,cnt:h,pageID:p,filter:T},{list:m,pageInfo:w}=await et.getContents(d,i);return{list:m,pageNo:Number(p),totalPage:Math.ceil(w.totalCnt/h)}}catch{return null}})()}},Ht=Object.freeze(Object.defineProperty({__proto__:null,load:Et},S...
- file: https://granbluefantasy.com/_app/immutable/nodes/15.CTBfrOAp.js
  - endpoint: news-archive
  - snippet: {endpoint:"news-archive",apiId:tt,cnt:h,pageID:p,filter:T},{list:m,pageInfo:w}=await et.getContents(d,i);return{list:m,pageNo:Number(p),totalPage:Math.ceil(w.totalCnt/h)}}catch{return null}})()}},Ht=Object.freeze(Object.defineProperty({__proto__:null,load:Et},...
- file: https://granbluefantasy.com/_app/immutable/nodes/3.CYdVRgwX.js
  - endpoint: news
  - snippet: endpoint:"news",apiId:Ze,cnt:a,pageID:"1"},n),et.getContents({endpoint:"news-nav",apiId:Ze},n)]);return{list:c.list,pageInfo:c.pageInfo,categories:m.categories||[]}}catch{return null}},[r,o]=await Promise.all([et.getContents({endpoint:"banners",apiId:Ze},n).ca...
- file: https://granbluefantasy.com/_app/immutable/nodes/3.CYdVRgwX.js
  - endpoint: movies
  - snippet: endpoint:"movies",apiId:Ze},n).catch(()=>null)]),i=r?.list?.[0]?.banner_info?.map(a=>({id:a.image.id,href:a.target_url,src:a.image.url,alt:a.image.desc||""}))??[],l=o?.list?.[0]?.movie_info?.map(a=>({id:a.thumb.id,href:a.url,thumb:a.thumb.url,alt:a.thumb.desc|...
- file: https://granbluefantasy.com/_app/immutable/nodes/3.CYdVRgwX.js
  - endpoint: news
  - snippet: {endpoint:"news",apiId:Ze,cnt:a,pageID:"1"},n),et.getContents({endpoint:"news-nav",apiId:Ze},n)]);return{list:c.list,pageInfo:c.pageInfo,categories:m.categories||[]}}catch{return null}},[r,o]=await Promise.all([et.getContents({endpoint:"banners",apiId:Ze},n).c...
- file: https://granbluefantasy.com/_app/immutable/nodes/3.CYdVRgwX.js
  - endpoint: movies
  - snippet: {endpoint:"movies",apiId:Ze},n).catch(()=>null)]),i=r?.list?.[0]?.banner_info?.map(a=>({id:a.image.id,href:a.target_url,src:a.image.url,alt:a.image.desc||""}))??[],l=o?.list?.[0]?.movie_info?.map(a=>({id:a.thumb.id,href:a.url,thumb:a.thumb.url,alt:a.thumb.desc...
- file: https://granbluefantasy.com/_app/immutable/nodes/3.CYdVRgwX.js
  - endpoint: news
  - snippet: getContents({endpoint:"news",apiId:Ze,cnt:a,pageID:"1"}
- file: https://granbluefantasy.com/_app/immutable/nodes/3.CYdVRgwX.js
  - endpoint: news-nav
  - snippet: getContents({endpoint:"news-nav",apiId:Ze}
- file: https://granbluefantasy.com/_app/immutable/nodes/3.CYdVRgwX.js
  - endpoint: banners
  - snippet: getContents({endpoint:"banners",apiId:Ze}
- file: https://granbluefantasy.com/_app/immutable/nodes/3.CYdVRgwX.js
  - endpoint: movies
  - snippet: getContents({endpoint:"movies",apiId:Ze}
- file: https://granbluefantasy.com/_app/immutable/nodes/14.DXLXDa3r.js
  - endpoint: wp_news/details
  - snippet: {endpoint:u?"wp_news/details":"news/details",contentId:m.id,apiId:vt,cnt:1};g&&(h.endpoint=u?"wp_news/preview":"news/preview",h.preview_token=g);const{prev_id:L,details:i,next_id:w}=await wt.getContent(h,y);return i&&(i.content=i.content.replace(/ ●/g,'<span s...

## API直接fetch結果

- apiId: 1
- updateカテゴリ topics_id: 118

### news-nav

- URL: https://granbluefantasy.com/rcms-api/1/news-nav?_lang=ja
- HTTPステータスコード: 200
- Content-Type: application/json;charset=UTF-8
- レスポンスサイズ: 62524 bytes
- ルートキー: news, categories
- list件数: 4
- categories件数: 4
- pageInfoキー: なし
- サンプルキー: topics_id, ymd, contents_type, subject, topics_flg, open_flg, regular_flg, inst_ymdhi, update_ymdhi, topics_group_id, post_time, slug, group_nm, group_description, contents_type_cnt, contents_type_nm, contents_type_slug, contents_type_parent_nm, category_parent_id, contents_type_ext_col_01, contents_type_ext_col_02, contents_type_ext_col_03, contents_type_ext_col_04, contents_type_ext_col_05, contents_type_list, is_target_push_notification, categories, toc, content, excerpt, thumb, not_to_list, apply_new_style
- フィールド検出: title=あり, publishedDate=あり, category=あり, articleId=あり, slug=あり, body=あり
- サンプル: id=9703, date=2026-05-19 19:00:00, slug=なし
- タイトルスニペット: グランデフェス開催のお知らせ
- カテゴリ参照: 118:update
- 本文長: 2909
- 本文確認スニペット: こんにちは、運営事務局です！ 5月19日(火) 19:00より、「グランデフェス」を開催することをお知らせいたします。 グランデフェス開催！ 【提供期間】 2026年5月19日(火) 19:00 ～ 2026年5月22日(金) 18:59 ・レジェンドガチャでSSレア装備の出現する確率が、通常3%のところ6%にアップします！ ・レジェンドガチャより、下記の装...
- 開催期間・実施期間候補: なし (0件)
なし

### NEWS一覧

- URL: https://granbluefantasy.com/rcms-api/1/news?cnt=3&pageID=1&_lang=ja
- HTTPステータスコード: 200
- Content-Type: application/json;charset=UTF-8
- レスポンスサイズ: 35340 bytes
- ルートキー: errors, messages, list, pageInfo
- list件数: 3
- categories件数: 0
- pageInfoキー: totalCnt, perPage, totalPageCnt, pageNo, firstIndex, lastIndex, path, param, startPageNo, endPageNo
- サンプルキー: topics_id, ymd, contents_type, subject, topics_flg, open_flg, regular_flg, inst_ymdhi, update_ymdhi, topics_group_id, post_time, slug, group_nm, group_description, contents_type_cnt, contents_type_nm, contents_type_slug, contents_type_parent_nm, category_parent_id, contents_type_ext_col_01, contents_type_ext_col_02, contents_type_ext_col_03, contents_type_ext_col_04, contents_type_ext_col_05, contents_type_list, is_target_push_notification, categories, toc, content, excerpt, thumb, not_to_list, apply_new_style
- フィールド検出: title=あり, publishedDate=あり, category=あり, articleId=あり, slug=あり, body=あり
- サンプル: id=9703, date=2026-05-19 19:00:00, slug=なし
- タイトルスニペット: グランデフェス開催のお知らせ
- カテゴリ参照: 118:update
- 本文長: 2909
- 本文確認スニペット: こんにちは、運営事務局です！ 5月19日(火) 19:00より、「グランデフェス」を開催することをお知らせいたします。 グランデフェス開催！ 【提供期間】 2026年5月19日(火) 19:00 ～ 2026年5月22日(金) 18:59 ・レジェンドガチャでSSレア装備の出現する確率が、通常3%のところ6%にアップします！ ・レジェンドガチャより、下記の装...
- 開催期間・実施期間候補: なし (0件)
なし

### カテゴリ別NEWS update

- URL: https://granbluefantasy.com/rcms-api/1/categorized-news?cnt=3&pageID=1&filter=categories.module_id+contains+118&_lang=ja
- HTTPステータスコード: 200
- Content-Type: application/json;charset=UTF-8
- レスポンスサイズ: 24640 bytes
- ルートキー: errors, messages, list, pageInfo
- list件数: 3
- categories件数: 0
- pageInfoキー: totalCnt, perPage, totalPageCnt, pageNo, firstIndex, lastIndex, path, param, startPageNo, endPageNo
- サンプルキー: topics_id, ymd, contents_type, subject, topics_flg, open_flg, regular_flg, inst_ymdhi, update_ymdhi, topics_group_id, post_time, slug, group_nm, group_description, contents_type_cnt, contents_type_nm, contents_type_slug, contents_type_parent_nm, category_parent_id, contents_type_ext_col_01, contents_type_ext_col_02, contents_type_ext_col_03, contents_type_ext_col_04, contents_type_ext_col_05, contents_type_list, is_target_push_notification, categories, toc, content, excerpt, thumb, not_to_list, apply_new_style
- フィールド検出: title=あり, publishedDate=あり, category=あり, articleId=あり, slug=あり, body=あり
- サンプル: id=9703, date=2026-05-19 19:00:00, slug=なし
- タイトルスニペット: グランデフェス開催のお知らせ
- カテゴリ参照: 118:update
- 本文長: 2909
- 本文確認スニペット: こんにちは、運営事務局です！ 5月19日(火) 19:00より、「グランデフェス」を開催することをお知らせいたします。 グランデフェス開催！ 【提供期間】 2026年5月19日(火) 19:00 ～ 2026年5月22日(金) 18:59 ・レジェンドガチャでSSレア装備の出現する確率が、通常3%のところ6%にアップします！ ・レジェンドガチャより、下記の装...
- 開催期間・実施期間候補: なし (0件)
なし

### 月別アーカイブ 2026-05

- URL: https://granbluefantasy.com/rcms-api/1/news-archive?cnt=3&pageID=1&filter=%28ymd+%3E%3D+%222026-05-01%22+AND+ymd+%3C%3D+%222026-05-31%22%29&_lang=ja
- HTTPステータスコード: 200
- Content-Type: application/json;charset=UTF-8
- レスポンスサイズ: 35420 bytes
- ルートキー: errors, messages, list, pageInfo
- list件数: 3
- categories件数: 0
- pageInfoキー: totalCnt, perPage, totalPageCnt, pageNo, firstIndex, lastIndex, path, param, startPageNo, endPageNo
- サンプルキー: topics_id, ymd, contents_type, subject, topics_flg, open_flg, regular_flg, inst_ymdhi, update_ymdhi, topics_group_id, post_time, slug, group_nm, group_description, contents_type_cnt, contents_type_nm, contents_type_slug, contents_type_parent_nm, category_parent_id, contents_type_ext_col_01, contents_type_ext_col_02, contents_type_ext_col_03, contents_type_ext_col_04, contents_type_ext_col_05, contents_type_list, is_target_push_notification, categories, toc, content, excerpt, thumb, not_to_list, apply_new_style
- フィールド検出: title=あり, publishedDate=あり, category=あり, articleId=あり, slug=あり, body=あり
- サンプル: id=9703, date=2026-05-19 19:00:00, slug=なし
- タイトルスニペット: グランデフェス開催のお知らせ
- カテゴリ参照: 118:update
- 本文長: 2909
- 本文確認スニペット: こんにちは、運営事務局です！ 5月19日(火) 19:00より、「グランデフェス」を開催することをお知らせいたします。 グランデフェス開催！ 【提供期間】 2026年5月19日(火) 19:00 ～ 2026年5月22日(金) 18:59 ・レジェンドガチャでSSレア装備の出現する確率が、通常3%のところ6%にアップします！ ・レジェンドガチャより、下記の装...
- 開催期間・実施期間候補: なし (0件)
なし

### 月別アーカイブ 2026-04

- URL: https://granbluefantasy.com/rcms-api/1/news-archive?cnt=3&pageID=1&filter=%28ymd+%3E%3D+%222026-04-01%22+AND+ymd+%3C%3D+%222026-04-30%22%29&_lang=ja
- HTTPステータスコード: 200
- Content-Type: application/json;charset=UTF-8
- レスポンスサイズ: 45114 bytes
- ルートキー: errors, messages, list, pageInfo
- list件数: 3
- categories件数: 0
- pageInfoキー: totalCnt, perPage, totalPageCnt, pageNo, firstIndex, lastIndex, path, param, startPageNo, endPageNo
- サンプルキー: topics_id, ymd, contents_type, subject, topics_flg, open_flg, regular_flg, inst_ymdhi, update_ymdhi, topics_group_id, post_time, slug, group_nm, group_description, contents_type_cnt, contents_type_nm, contents_type_slug, contents_type_parent_nm, category_parent_id, contents_type_ext_col_01, contents_type_ext_col_02, contents_type_ext_col_03, contents_type_ext_col_04, contents_type_ext_col_05, contents_type_list, is_target_push_notification, categories, toc, content, excerpt, thumb, not_to_list, apply_new_style
- フィールド検出: title=あり, publishedDate=あり, category=あり, articleId=あり, slug=あり, body=あり
- サンプル: id=9683, date=2026-04-30 12:00:00, slug=なし
- タイトルスニペット: レジェンドフェス開催＆新キャラクター「フェルルカ」「マヌ＝ポヌマウ」紹介のお知らせ
- 本文長: 12236
- 本文確認スニペット: こんにちは、運営事務局です！ 本日のレジェンドガチャ更新にて登場するキャラクターをご紹介いたします！ SSレア「フェルルカ」 年齢：20歳 身長：178cm 種族：エルーン 趣味：盤上遊戯、遺跡巡り 好き：メルゥ、ネモネ、団長さん 苦手：暗がり、ひとり 屈強な女性のみが生まれるという辺境の村クフア、そこを治める若き女王(アリィ)のフェルルカが、クフアの神であ...
- 開催期間・実施期間候補: なし (0件)
なし

### 記事詳細 9690

- URL: https://granbluefantasy.com/rcms-api/1/news/details/9690?cnt=1&_lang=ja
- HTTPステータスコード: 200
- Content-Type: application/json;charset=UTF-8
- レスポンスサイズ: 41666 bytes
- ルートキー: errors, messages, details, prev_id, next_id
- list件数: 0
- categories件数: 0
- pageInfoキー: なし
- サンプルキー: topics_id, ymd, contents_type, subject, topics_flg, open_flg, regular_flg, inst_ymdhi, update_ymdhi, topics_group_id, post_time, slug, group_nm, group_description, contents_type_cnt, contents_type_nm, contents_type_slug, contents_type_parent_nm, category_parent_id, contents_type_ext_col_01, contents_type_ext_col_02, contents_type_ext_col_03, contents_type_ext_col_04, contents_type_ext_col_05, contents_type_list, is_target_push_notification, categories, toc, content, excerpt, thumb, not_to_list, apply_new_style
- フィールド検出: title=あり, publishedDate=あり, category=あり, articleId=あり, slug=あり, body=あり
- サンプル: id=9690, date=2026-05-01 12:00:00, slug=なし
- タイトルスニペット: これからの『グランブルーファンタジー』2026年5月号
- カテゴリ参照: 118:update
- 本文長: 23163
- 本文確認スニペット: 騎空士の皆さま、こんにちは。 運営事務局です。 風薫る爽やかな季節となりましたが、皆さまいかがお過ごしでしょうか。 今月は『鋼の錬金術師 FULLMETAL ALCHEMIST』とのコラボレーションイベントの開催や、シェロカルテの特別訓練に上伝を追加するなど様々なアップデートを行ってまいります！ それでは今月のアップデート情報をご紹介します！ イベント「アー...
- 開催期間・実施期間候補: あり (8件)
  - 開催期間 2026/5/15（金）17:00 ～ 2026/5/27（水）20:59 ※2026/5/20（水）17:00に後編を追加予定です イベント限定キャラクター・召喚石 イベントストーリーのオープニングをクリアすることで、SSレア 土属性「エドワード・エルリック」を仲間にすることが
  - 開催期間 5/15（金）17:00 ～ 5/27（水）20:59 概要 イベント期間中、ほとんどのクエストやマルチバトルから「金色の錬成」に使用できる特別なトレジャーが獲得できるようになります
  - 期間限定で装備できるセフィラ導本があります
  - 期間 2026/5/15（金）17:00 ～ 2026/5/27（水）20:59 ※2026/5/20（水）17:00に後編を追加予定です イベント限定キャラクター・召喚石 イベントストーリーのオープニングをクリアすることで、SSレア 土属性「エドワード・エルリック」を仲間にすることが
  - 期間中には、様々な課題を達成することで報酬を獲得できる「国家錬金術師資格試験」を開催予定です
  - 期間 5/15（金）17:00 ～ 5/27（水）20:59 概要 イベント期間中、ほとんどのクエストやマルチバトルから「金色の錬成」に使用できる特別なトレジャーが獲得できるようになります
  - 期間中は、対象クエストにおいて、発見者のみ1回のプレイでクエスト2回分の宝箱を獲得できるようになります
  - 期間限定で、紫色の宝箱に入った「追加報酬」も獲得可能となります

## 取得できたフィールド一覧

  - apply_new_style
  - categories
  - category_parent_id
  - content
  - contents_type
  - contents_type_cnt
  - contents_type_ext_col_01
  - contents_type_ext_col_02
  - contents_type_ext_col_03
  - contents_type_ext_col_04
  - contents_type_ext_col_05
  - contents_type_list
  - contents_type_nm
  - contents_type_parent_nm
  - contents_type_slug
  - excerpt
  - group_description
  - group_nm
  - inst_ymdhi
  - is_target_push_notification
  - not_to_list
  - open_flg
  - post_time
  - regular_flg
  - slug
  - subject
  - thumb
  - toc
  - topics_flg
  - topics_group_id
  - topics_id
  - update_ymdhi
  - ymd

## saisoku側で保存できそうな項目

- `topics_id`: 公式記事ID。詳細URL `/ja/news/{topics_id}/` の生成に使える。
- `slug`: ある場合は公式表示と同じ記事URL補助に使える。空の場合は `topics_id` を使う。
- `subject`: 記事タイトル。
- `ymd` + `post_time`: 公開日・公開時刻。
- `categories[].module_id` と `news-nav.categories`: カテゴリ名解決。
- `excerpt`: 一覧用の短い説明候補。保存する場合も全文コピーにならない範囲で扱う。
- `content`: 記事詳細本文。保存は全文ではなく、必要な開催期間・実施期間などの抽出結果と参照URLに留める。
- `thumb` / `old_thumb`: 公式画像URL候補。saisoku方針上、直接保存・直接依存は避ける。

## APIが使えない場合の代替案

- 公式ページURLを参考URLとして保存し、人間が内容を確認して必要項目のみメモ化する。
- Playwrightレンダリング後DOMを調査用に使う。ただし運用機能としては依存ライブラリ・実行コスト・外部負荷が重い。
- API仕様変更時は、JS内の `getContents` / `getContent` 使用箇所を再調査してエンドポイントだけ更新する。

## Playwrightレンダリング後DOM

- 指定コマンド試行: npx playwright install --with-deps chromium は試行済み。sudo パスワード要求でOS依存ライブラリ導入は未完了。
- 判定: 未実行
- 理由: browserType.launch: Target page, context or browser has been closed
- lddで検出した不足ライブラリ:
  - libasound.so.2
  - libnspr4.so
  - libnss3.so
  - libnssutil3.so
  - libsmime3.so

## 実行方法

```bash
node scripts/investigateOfficialNewsApi.mjs
```

