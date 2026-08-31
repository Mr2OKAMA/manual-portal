# Manual Hub

工場・プラント向けのマニュアル管理ポータルです。GitHub Pagesで公開できるVanilla JavaScript構成になっています。

## Files

- `index.html`: ポータル画面の構造
- `style.css`: Microsoft 365 / SharePointを意識したレスポンシブUI
- `script.js`: 検索、分類絞り込み、件数集計、一覧描画
- `manuals.js`: 管理者が更新する分類定義とマニュアルデータ
- `admin.html`: サイト上で登録・削除を行う管理画面
- `admin.js`: 管理画面の処理とブラウザ保存

## Site administration

一覧画面右上の「管理画面」から `admin.html` を開きます。文書番号、分類、タイトル、改訂日、SharePoint URLを入力して登録すると、一覧画面へ反映されます。登録済み手順書は文書番号・タイトル・分類で検索でき、改訂日は各行の日付欄を変更して「更新」を押すと反映されます。削除も同じ画面から実行できます。

GitHub Pagesは静的ホスティングのため、管理画面での変更は操作したブラウザの `localStorage` に保存されます。全ユーザーで同じ登録内容を共有するには、SharePoint ListなどのデータソースとAPIを接続してください。

## Data maintenance

管理者は `manuals.js` の `documents` 配列だけを編集します。各行は次の形式です。

```js
{
	no: "01-001",
	category: "01",
	categoryName: "運転・運用マニュアル",
	title: "ボイラー起動手順",
	date: "2026-08-01",
	url: "https://sharepoint.example.com/manuals/01-001"
}
```

分類コードは `01`（運転・運用）、`02`（保守・点検）、`03`（緊急時対応）、`04`（分析・測定）です。`url` はSharePoint上の実際の文書URLに置き換えてください。

## SharePoint migration point

データ取得は `script.js` の `loadDocuments()` に集約しています。現在は `manuals.js` の `documents` を返しますが、将来SharePoint Listへ移行する際は、この関数をREST API呼び出しへ差し替えます。

## Local preview

静的ファイルのため、`index.html` を直接開くか、リポジトリのルートで次のコマンドを実行します。

```bash
python3 -m http.server 8000
```

その後、`http://localhost:8000` を開いてください。
