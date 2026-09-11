import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, type LucideIcon } from 'lucide-react'
import { MarketingHeader } from './MarketingHeader'

export function PublicPage({ eyebrow, title, intro, cards, icon: Icon }: { eyebrow: string; title: string; intro: string; cards: {title:string;text:string}[]; icon: LucideIcon }) {
  return <main className="public-page"><MarketingHeader/><section className="public-hero"><div className="container"><p className="eyebrow"><span/>{eyebrow}</p><h1>{title}</h1><p>{intro}</p><Link to="/app/book" className="button button-primary">Book a ride <ArrowRight size={16}/></Link></div></section><section className="public-content"><div className="container"><div className="public-cards">{cards.map((card) => <article className="public-card" key={card.title}><Icon size={24}/><h3>{card.title}</h3><p>{card.text}</p><span className="text-link"><Check size={14}/> Configuration-led service</span></article>)}</div></div></section></main>
}
