// Child Labor Project — global footer (developer credit + contact links).
import { Phone, Mail, Send, MessageCircle, Facebook } from "lucide-react";

const PHONE = "+201229115949";
const PHONE_DIGITS = "201229115949"; // no "+" for wa.me / t.me
const EMAIL = "youshiaz@gmail.com";
const FACEBOOK = "https://www.facebook.com/youshia.zakaria/";

const iconBtn =
  "grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-primary-foreground/80 transition-colors hover:bg-white/20 hover:text-white";

export default function Footer() {
  return (
    <footer className="mt-4 border-t border-white/10 bg-primary text-primary-foreground">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm">
            System developed by{" "}
            <span className="font-display font-semibold text-white">Youshia Zakaria</span>
          </p>
          <p className="mt-1 text-xs text-primary-foreground/70">
            Want your own system, website or application built? Get in touch.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${PHONE_DIGITS}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            title="WhatsApp"
            className={iconBtn}
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          {/* Telegram */}
          <a
            href={`https://t.me/+${PHONE_DIGITS}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            title="Telegram"
            className={iconBtn}
          >
            <Send className="h-4 w-4" />
          </a>
          {/* Phone call */}
          <a href={`tel:${PHONE}`} aria-label="Call" title={PHONE} className={iconBtn}>
            <Phone className="h-4 w-4" />
          </a>
          {/* Facebook */}
          <a
            href={FACEBOOK}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            title="Facebook"
            className={iconBtn}
          >
            <Facebook className="h-4 w-4" />
          </a>
          {/* Email — shown in full, not just an icon */}
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-primary-foreground/90 transition-colors hover:bg-white/20 hover:text-white"
          >
            <Mail className="h-4 w-4" />
            {EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
