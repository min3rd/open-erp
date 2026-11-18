import fs from 'node:fs';

const dirs = [
  'src/frontend/web/public/i18n',
  'plugins/office-webapp/web/src/i18n',
];
const en = {
  'office.rb.checklist': 'Checklist',
  'office.rb.paragraphBorders': 'Paragraph Borders',
  'office.rb.paragraphOptions': 'Paragraph Options',
  'office.rb.emoji': 'Emoji',
  'office.rb.markAllRead': 'Mark All as Read',
  'office.rb.viewHeaderFooter': 'Header & Footer',
  'office.rb.viewFootnotes': 'Footnotes',
  'office.rb.viewEndnotes': 'Endnotes',
  'office.word.paragraphOptions': 'Paragraph options',
  'office.word.lineSpacingLabel': 'Line spacing',
  'office.word.paragraphOptionsHint': 'Applies line spacing and indentation to the selected paragraph.',
  'office.word.emojiTitle': 'Insert emoji',
  'office.word.emojiHint': 'Emoji is inserted as document text.',
  'office.emoji.smile': 'Smile',
  'office.emoji.heart': 'Heart',
  'office.emoji.thumb': 'Thumbs up',
  'office.emoji.star': 'Star',
  'office.emoji.party': 'Celebration',
  'office.emoji.check': 'Check',
};
const vi = {
  'office.rb.checklist': 'Danh sách kiểm',
  'office.rb.paragraphBorders': 'Viền đoạn',
  'office.rb.paragraphOptions': 'Tùy chọn đoạn',
  'office.rb.emoji': 'Biểu tượng cảm xúc',
  'office.rb.markAllRead': 'Đánh dấu tất cả đã đọc',
  'office.rb.viewHeaderFooter': 'Đầu trang & chân trang',
  'office.rb.viewFootnotes': 'Chú thích cuối trang',
  'office.rb.viewEndnotes': 'Chú thích cuối văn bản',
  'office.word.paragraphOptions': 'Tùy chọn đoạn',
  'office.word.lineSpacingLabel': 'Giãn dòng',
  'office.word.paragraphOptionsHint': 'Áp dụng giãn dòng và thụt lề cho đoạn đang chọn.',
  'office.word.emojiTitle': 'Chèn biểu tượng cảm xúc',
  'office.word.emojiHint': 'Biểu tượng được chèn như nội dung văn bản.',
  'office.emoji.smile': 'Cười',
  'office.emoji.heart': 'Trái tim',
  'office.emoji.thumb': 'Đồng ý',
  'office.emoji.star': 'Ngôi sao',
  'office.emoji.party': 'Chúc mừng',
  'office.emoji.check': 'Hoàn thành',
};

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const path = `${dir}/${file}`;
    const dictionary = JSON.parse(fs.readFileSync(path, 'utf8'));
    const locale = file.replace(/\.json$/, '');
    const values = locale === 'vi' ? vi : en;
    for (const [key, value] of Object.entries(values)) {
      if (!dictionary[key]) dictionary[key] = value;
    }
    fs.writeFileSync(path, JSON.stringify(dictionary, null, 2) + '\n');
    console.log('updated', path);
  }
}
