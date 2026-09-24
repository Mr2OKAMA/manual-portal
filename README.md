# Manual Hub

工場・プラント向けのマニュアル管理ポータルです。GitHub Pagesで公開できるVanilla JavaScript構成になっています。

- 公開サイト: https://mr2okama.github.io/manual-portal/
- JSONエディター: https://mr2okama.github.io/manual-portal/json-editor.html

## Files

- `index.html`: ポータル画面の構造
- `style.css`: Microsoft 365 / SharePointを意識したレスポンシブUI
- `script.js`: 検索、分類絞り込み、件数集計、一覧描画
- `manuals.json`: 管理者が更新する分類定義とマニュアル表示メタデータ
- `admin.html`: サイト上で登録・削除を行う管理画面
- `admin.js`: 管理画面の処理とブラウザ保存
- `id-rules.html`: マニュアル管理番号の命名ルール一覧
- `json-editor.html`: ブラウザだけで使える JSON エディター
- `json-editor.js`: JSON の読み込み・整形・圧縮・検証・ダウンロード処理

## Site administration

一覧画面右上の「管理画面」から `admin.html` を開きます。文書番号、分類、タイトル、改訂日、SharePoint URLを入力して登録すると、一覧画面へ反映されます。

GitHub Pagesは静的ホスティングのため、管理画面での変更は操作したブラウザの `localStorage` に保存されるプレビュー用の差分です。全ユーザーで共有する場合は `manuals.json` を直接更新してください。

## JSON editor

一覧画面や各サブページ上部の「JSONエディター」リンク、または [公開JSONエディター](https://mr2okama.github.io/manual-portal/json-editor.html) から `json-editor.html` を開くと、`manuals.json` を初期表示した状態で JSON を編集できます。

- `JSONファイルを開く`: UTF-8 の `.json` ファイルをローカルから読み込み
- `構文チェック`: JSON の妥当性を確認し、エラー時は位置情報付きで表示
- `整形` / `圧縮`: pretty print と minify を実行
- `JSONをダウンロード`: 編集結果をローカルへ保存

## Data maintenance

管理者は `manuals.json` の `categories` と `documents` を編集します。文書の各要素は次の形式です。

```json
{
	"no": "01-001",
	"category": "01",
	"categoryName": "運転・運用マニュアル",
	"title": "ボイラー起動手順",
	"date": "2026-08-01",
	"url": "https://sharepoint.example.com/manuals/01-001"
}
```

分類コードは `01`（運転・運用）、`02`（保守・点検）、`03`（緊急時対応）、`04`（分析・測定）です。`url` はSharePoint上の実際の文書URLに置き換えてください。

SharePoint APIへの接続は行いません。SharePoint上のファイルを開くための URL だけを `url` に保持します。

## Document numbering rules（管理番号記入ルール）

電気班安全作業標準の書式に基づく管理番号の採番ルールです。サイト上では `id-rules.html`（一覧画面右上「管理番号ルール」リンク）から確認できます。

管理番号は次の形式です。

```
ET06-01-01
```

| 部分 | 例 | 内容 |
| --- | --- | --- |
| 1文字目 | `E` | 作業種別（下表） |
| 2文字目 | `T` | 定常区分（下表） |
| 3〜4文字目 | `06` | 点検種別（下表） |
| ハイフン後の2桁 | `01` | 施設番号（下表） |
| 末尾の2桁 | `01` | その施設から始まる昇順番号 |

**作業種別コード**：`M`=保守点検作業、`W`=水処理作業、`E`=電気点検作業、`C`=中央作業、`N`=日常点検、`S`=週点検

**定常区分コード**：`T`=定常作業、`H`=非定常作業

**点検種別コード**：`00`=非定常作業、`01`=月点検、`06`=6ヶ月点検、`12`=年次点検

**施設番号コード**：`01`流入ポンプ棟、`02`1系水処理、`03`2系水処理、`04`3系水処理、`05`4系水処理、`06`送風機棟、`07`ろ過池（Ⅰ-1）、`08`ろ過池（Ⅰ-2）、`09`ろ過池（Ⅱ-1）、`10`ろ過池（Ⅱ-2）、`11`薬品注入棟、`12`汚泥処理棟、`13`管理棟、`14`電気室、`15`ポンプ室、`16`計量棟、`17`取水施設、`18`沈砂池、`19`急速ろ過棟、`20`排水処理施設、`21`受変電設備、`22`その他

新しい施設が増設された場合は23から順に番号を増やします。改定日は最新のものだけを記入します。

JSONの形式を確認するには、リポジトリのルートで次のコマンドを実行します。

```bash
python3 -m json.tool manuals.json
```
