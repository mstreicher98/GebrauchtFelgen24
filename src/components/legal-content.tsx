import { Fragment } from "react";
import type { Block, Inline } from "@/lib/legal-markdown";

function Inlines({ nodes }: { nodes: Inline[] }) {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return <Fragment key={i}>{n.v}</Fragment>;
      case "br":
        return <br key={i} />;
      case "strong":
        return (
          <strong key={i}>
            <Inlines nodes={n.c} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <Inlines nodes={n.c} />
          </em>
        );
      case "ph":
        return (
          <span key={i} className="placeholder">
            [{n.v}]
          </span>
        );
      case "link": {
        const external = /^https?:\/\//.test(n.href);
        return (
          <a key={i} href={n.href} className="link" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            <Inlines nodes={n.c} />
          </a>
        );
      }
    }
  });
}

/** Rendert einen geparsten Rechtstext (siehe src/lib/legal-markdown.ts) – ohne HTML aus dem Text. */
export function LegalContent({ blocks }: { blocks: Block[] }) {
  return blocks.map((b, i) => {
    if ("items" in b) {
      const List = b.t;
      return (
        <List key={i}>
          {b.items.map((item, j) => (
            <li key={j}>
              <Inlines nodes={item} />
            </li>
          ))}
        </List>
      );
    }
    const Tag = b.t;
    return (
      <Tag key={i}>
        <Inlines nodes={b.c} />
      </Tag>
    );
  });
}
