import React from 'react';
import { ShieldCheck } from 'lucide-react';

const AuthBrand = () => (
  <aside className="auth-brand">
    <div className="auth-brand-mark">
      <img src="/logo-sman1-talang-padang.png" alt="Logo SMAN 1 Talang Padang" />
    </div>
    <div className="auth-brand-copy">
      <span className="auth-eyebrow">SMAN 1 TALANG PADANG</span>
      <h2>Terhubung, tumbuh, dan berkarya bersama alumni.</h2>
      <p>
        Ruang informasi dan penelusuran alumni untuk mendukung perjalanan pendidikan
        serta karier lulusan.
      </p>
    </div>
    <div className="auth-brand-note">
      <ShieldCheck size={17} />
      <span>Portal resmi alumni sekolah</span>
    </div>
    <div className="auth-brand-orbit auth-brand-orbit-one" />
    <div className="auth-brand-orbit auth-brand-orbit-two" />
  </aside>
);

export default AuthBrand;
