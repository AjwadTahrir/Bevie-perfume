/**
 * PRIVACY POLICY (/privacy), in English and Bahasa Malaysia.
 * Each section is a heading and a body; a string is a paragraph and
 * an array of strings is a bullet list. Keep both languages saying
 * the same thing, and update `updated` whenever the wording changes.
 *
 * The privacy email is optional: set brand.privacyEmail in
 * src/config/brand.js and it is listed under "Contact us".
 */

export const privacy = {
  en: {
    label: 'English',
    title: 'Privacy Policy',
    updated: 'Last updated: 29 October 2026',
    intro: [
      'This notice explains how JETHA Fragrance ("JETHA", "we", "us") collects and uses your personal data on jethafragrance.store, in line with Malaysia\'s Personal Data Protection Act 2010 (PDPA).',
      'JETHA Fragrance is a student fundraiser run by the organising committee of the Titian Serantau: Thailand Mobility Programme, Kolej Kediaman Tun Ahmad Zaidi (KK10), Universiti Malaya. It is not a registered business. By placing an order, you agree to this notice.',
    ],
    sections: [
      {
        h: '1. Personal data we collect',
        body: [
          [
            'Contact details: your name and phone (WhatsApp) number, and any order notes you add.',
            'Order details: what you ordered, the total, and any committee promo code you used.',
            'Proof of payment: the screenshot you upload and the transfer reference. A screenshot usually shows your name, your bank and part of your account number. We never see your online banking login, password or card details.',
            'Messages: anything you send us on WhatsApp or Instagram.',
          ],
          'We do not ask for your email or home address, and we do not use analytics or advertising trackers.',
        ],
      },
      {
        h: '2. Why we use your data',
        body: [
          [
            'To confirm your order and check your payment against our bank account.',
            'To contact you on WhatsApp to arrange collection of your order.',
            'To credit the sale to the committee member whose promo code you used, for the fundraiser\'s sales targets.',
            'To answer your questions and handle refunds or problems with an order.',
            'To prevent fraud, such as one transfer being used for two orders, and to keep the fundraiser\'s accounts.',
          ],
          'We do not use your data for marketing and we do not send newsletters.',
          'Your name, phone number and proof of payment are needed to place an order. If you choose not to give them, we cannot process it.',
        ],
      },
      {
        h: '3. Who can see it',
        body: [
          [
            'Committee members who manage orders and payments, through a sign-in-only admin console.',
            'If you use a promo code, the committee member it belongs to is credited with the sale and may contact you to arrange collection.',
            'Our service providers: Supabase, which stores orders and payment screenshots, and Vercel, which hosts the website.',
            'Government or law enforcement bodies, where the law requires it.',
          ],
          'We do not sell your personal data or share it for advertising.',
        ],
      },
      {
        h: '4. Cookies and browser storage',
        body: [
          'The website does not use tracking cookies, analytics or ads. Your cart is saved in your own browser\'s local storage, so it is still there when you come back. It stays on your device until you place an order. You can remove it by emptying the cart or clearing this site\'s data in your browser.',
        ],
      },
      {
        h: '5. How long we keep it',
        body: [
          [
            'Orders and payment records, including payment screenshots: until the fundraiser\'s accounts are closed, and no later than 30 June 2027. We then delete them.',
            'Messages on WhatsApp or Instagram: these stay in those apps and are also covered by their own privacy policies.',
          ],
        ],
      },
      {
        h: '6. Security',
        body: [
          'The website uses HTTPS encryption. Orders and payment screenshots are kept in a private database that only signed-in committee admins can open; screenshots are never public. No method of sending or storing data is completely safe, so we cannot promise absolute security. If a data breach is likely to harm you, we will tell you and the authorities as the law requires.',
        ],
      },
      {
        h: '7. Your rights',
        body: [
          'Under the PDPA you may ask us to:',
          [
            'give you a copy of the personal data we hold about you;',
            'correct data that is wrong, incomplete or out of date;',
            'stop using your data, or withdraw your consent. We may still need to keep payment records until the fundraiser\'s accounts are closed.',
          ],
          'Contact us using the details in section 11. We may ask you to confirm who you are, and we aim to reply within 21 days.',
        ],
      },
      {
        h: '8. Data stored outside Malaysia',
        body: [
          'Our service providers, Supabase and Vercel, may store or process data on servers outside Malaysia. By placing an order, you agree to this. We only use providers that protect data to a standard comparable to the PDPA.',
        ],
      },
      {
        h: '9. Under 18s',
        body: ['If you are under 18, please get a parent\'s or guardian\'s permission before placing an order.'],
      },
      {
        h: '10. Changes to this notice',
        body: ['We may update this notice from time to time. The date at the top shows the latest version.'],
      },
      {
        h: '11. Contact us',
        body: ['For questions, to see or correct your data, or to withdraw your consent, contact the Titian Serantau organising committee, KK10, Universiti Malaya:'],
      },
    ],
    contact: { whatsapp: 'WhatsApp', instagram: 'Instagram', email: 'Email' },
  },

  ms: {
    label: 'Bahasa Malaysia',
    title: 'Dasar Privasi',
    updated: 'Dikemas kini: 29 Oktober 2026',
    intro: [
      'Notis ini menerangkan bagaimana JETHA Fragrance ("JETHA", "kami") mengumpul dan menggunakan data peribadi anda di jethafragrance.store, selaras dengan Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia.',
      'JETHA Fragrance ialah projek kutipan dana pelajar yang dikendalikan oleh jawatankuasa penganjur Titian Serantau: Thailand Mobility Programme, Kolej Kediaman Tun Ahmad Zaidi (KK10), Universiti Malaya. Ia bukan perniagaan berdaftar. Dengan membuat pesanan, anda bersetuju dengan notis ini.',
    ],
    sections: [
      {
        h: '1. Data peribadi yang kami kumpul',
        body: [
          [
            'Butiran hubungan: nama dan nombor telefon (WhatsApp) anda, serta apa-apa nota pesanan yang anda tambah.',
            'Butiran pesanan: barang yang anda pesan, jumlah bayaran dan kod promo jawatankuasa yang anda gunakan.',
            'Bukti pembayaran: tangkapan skrin yang anda muat naik dan rujukan pindahan. Tangkapan skrin biasanya menunjukkan nama anda, bank anda dan sebahagian nombor akaun anda. Kami tidak sekali-kali melihat log masuk perbankan dalam talian, kata laluan atau butiran kad anda.',
            'Mesej: apa-apa yang anda hantar kepada kami melalui WhatsApp atau Instagram.',
          ],
          'Kami tidak meminta alamat e-mel atau alamat rumah anda, dan kami tidak menggunakan alat analitik atau penjejak iklan.',
        ],
      },
      {
        h: '2. Mengapa kami menggunakan data anda',
        body: [
          [
            'Untuk mengesahkan pesanan anda dan menyemak bayaran anda dengan akaun bank kami.',
            'Untuk menghubungi anda melalui WhatsApp bagi mengatur pengambilan pesanan.',
            'Untuk mengkreditkan jualan kepada ahli jawatankuasa yang memiliki kod promo yang anda gunakan, bagi sasaran jualan kutipan dana.',
            'Untuk menjawab pertanyaan anda dan mengendalikan bayaran balik atau masalah pesanan.',
            'Untuk mencegah penipuan, contohnya satu pindahan digunakan untuk dua pesanan, dan untuk menyimpan akaun kutipan dana.',
          ],
          'Kami tidak menggunakan data anda untuk pemasaran dan tidak menghantar surat berita.',
          'Nama, nombor telefon dan bukti pembayaran anda diperlukan untuk membuat pesanan. Jika anda tidak memberikannya, kami tidak dapat memproses pesanan anda.',
        ],
      },
      {
        h: '3. Siapa yang boleh melihatnya',
        body: [
          [
            'Ahli jawatankuasa yang menguruskan pesanan dan bayaran, melalui konsol pentadbir yang memerlukan log masuk.',
            'Jika anda menggunakan kod promo, ahli jawatankuasa pemilik kod itu dikreditkan dengan jualan tersebut dan mungkin menghubungi anda untuk mengatur pengambilan.',
            'Penyedia perkhidmatan kami: Supabase, yang menyimpan pesanan dan tangkapan skrin pembayaran, dan Vercel, yang menjadi hos laman web.',
            'Badan kerajaan atau penguatkuasa undang-undang, apabila dikehendaki oleh undang-undang.',
          ],
          'Kami tidak menjual data peribadi anda atau berkongsinya untuk tujuan pengiklanan.',
        ],
      },
      {
        h: '4. Kuki dan storan pelayar',
        body: [
          'Laman web ini tidak menggunakan kuki penjejak, analitik atau iklan. Troli anda disimpan dalam storan tempatan pelayar anda sendiri supaya ia masih ada apabila anda kembali. Ia kekal pada peranti anda sehingga anda membuat pesanan. Anda boleh membuangnya dengan mengosongkan troli atau memadam data laman ini dalam pelayar anda.',
        ],
      },
      {
        h: '5. Tempoh kami menyimpan data',
        body: [
          [
            'Rekod pesanan dan pembayaran, termasuk tangkapan skrin pembayaran: sehingga akaun kutipan dana ditutup, dan tidak lewat daripada 30 Jun 2027. Selepas itu kami memadamkannya.',
            'Mesej di WhatsApp atau Instagram: mesej ini kekal dalam aplikasi tersebut dan tertakluk juga kepada dasar privasi aplikasi itu.',
          ],
        ],
      },
      {
        h: '6. Keselamatan',
        body: [
          'Laman web ini menggunakan penyulitan HTTPS. Pesanan dan tangkapan skrin pembayaran disimpan dalam pangkalan data peribadi yang hanya boleh dibuka oleh pentadbir jawatankuasa yang telah log masuk; tangkapan skrin tidak sekali-kali didedahkan kepada umum. Tiada kaedah penghantaran atau penyimpanan data yang selamat sepenuhnya, jadi kami tidak boleh menjanjikan keselamatan mutlak. Jika berlaku pelanggaran data yang berkemungkinan memudaratkan anda, kami akan memaklumkan anda dan pihak berkuasa seperti yang dikehendaki oleh undang-undang.',
        ],
      },
      {
        h: '7. Hak anda',
        body: [
          'Di bawah PDPA, anda boleh meminta kami untuk:',
          [
            'memberi salinan data peribadi anda yang kami simpan;',
            'membetulkan data yang salah, tidak lengkap atau sudah lapuk;',
            'berhenti menggunakan data anda, atau menarik balik persetujuan anda. Kami mungkin masih perlu menyimpan rekod pembayaran sehingga akaun kutipan dana ditutup.',
          ],
          'Hubungi kami melalui butiran dalam bahagian 11. Kami mungkin meminta anda mengesahkan identiti anda, dan kami berusaha membalas dalam tempoh 21 hari.',
        ],
      },
      {
        h: '8. Data yang disimpan di luar Malaysia',
        body: [
          'Penyedia perkhidmatan kami, Supabase dan Vercel, mungkin menyimpan atau memproses data di pelayan di luar Malaysia. Dengan membuat pesanan, anda bersetuju dengan perkara ini. Kami hanya menggunakan penyedia yang melindungi data pada tahap yang setanding dengan PDPA.',
        ],
      },
      {
        h: '9. Bawah umur 18 tahun',
        body: ['Jika anda berumur bawah 18 tahun, sila dapatkan kebenaran ibu bapa atau penjaga sebelum membuat pesanan.'],
      },
      {
        h: '10. Perubahan pada notis ini',
        body: ['Kami mungkin mengemas kini notis ini dari semasa ke semasa. Tarikh di bahagian atas menunjukkan versi terkini.'],
      },
      {
        h: '11. Hubungi kami',
        body: ['Untuk pertanyaan, melihat atau membetulkan data anda, atau menarik balik persetujuan anda, hubungi jawatankuasa penganjur Titian Serantau, KK10, Universiti Malaya:'],
      },
    ],
    contact: { whatsapp: 'WhatsApp', instagram: 'Instagram', email: 'E-mel' },
  },
}
