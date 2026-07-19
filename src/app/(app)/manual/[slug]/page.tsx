import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrintButton } from "@/components/ui/PrintButton";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function manualLink(href?: string) {
  if (!href) return { href: "#", external: false };
  if (href.startsWith("/") || href.startsWith("#")) return { href, external: false };
  if (/^https:\/\//i.test(href)) return { href, external: true };
  return { href: "#", external: false };
}

export default async function ManualDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const document = await db.manualDocument.findFirst({ where: { slug, published: true } });
  if (!document) notFound();
  const headings = document.content.split("\n").flatMap((line) => {
    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    return match ? [{ depth: match[1].length, text: match[2], id: slugify(match[2]) }] : [];
  });
  const updatedAt = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "long" }).format(document.updatedAt);
  return <div className="manual-detail-page">
    <div className="manual-detail-shell">
      <nav className="manual-breadcrumb" aria-label="パンくず"><Link href="/manual">マニュアル</Link><span aria-hidden="true">/</span><span aria-current="page">記事</span></nav>
      <header className="manual-article-header">
        <p className="manual-kicker">CLAS FinOps マニュアル</p>
        <h1>{document.title}</h1>
        <div className="manual-article-meta">
          <time dateTime={document.updatedAt.toISOString()}>最終更新 {updatedAt}</time>
          <div className="manual-article-actions"><PrintButton /><Link className="button-link" href="/manual">一覧へ戻る</Link></div>
        </div>
      </header>
      <div className="manual-layout" data-has-toc={headings.length > 0}>
      <article className="markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => <h2 id={slugify(String(children))}>{children}</h2>,
            h3: ({ children }) => <h3 id={slugify(String(children))}>{children}</h3>,
            a: ({ href, children }) => { const link = manualLink(href); return <a href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer noopener" : undefined}>{children}</a>; }
          }}
        >{document.content}</ReactMarkdown>
      </article>
      {headings.length ? <nav className="manual-toc local-nav" aria-label="目次"><span className="nav-label">目次</span>{headings.map((heading) => <a key={`${heading.depth}-${heading.id}`} href={`#${heading.id}`} style={{ paddingLeft: heading.depth === 3 ? 18 : 8 }}>{heading.text}</a>)}</nav> : null}
      </div>
    </div>
  </div>;
}
