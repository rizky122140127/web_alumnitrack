import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

const SchoolFooter = () => (
  <footer className="school-footer">
    <div className="school-footer-address">
      <MapPin size={17} aria-hidden="true" />
      <span>Jl. Banjarsari, Kec. Talang Padang, Kab. Tanggamus, Lampung – Indonesia 35377</span>
    </div>
    <a href="tel:+6272941194">
      <Phone size={16} aria-hidden="true" />
      <span>Telp. (0729) 41194</span>
    </a>
    <a href="mailto:sman1talangpadang@gmail.com">
      <Mail size={16} aria-hidden="true" />
      <span>sman1talangpadang@gmail.com</span>
    </a>
  </footer>
);

export default SchoolFooter;
