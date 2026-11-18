import fs from 'node:fs';

const dirs = [
  'src/frontend/web/public/i18n',
  'plugins/office-webapp/web/src/i18n',
];
const en = {
  'office.rb.bringForward': 'Bring Forward',
  'office.rb.sendBackward': 'Send Backward',
  'office.rb.selectionPane': 'Selection Pane',
  'office.rb.updateIndex': 'Update Index',
  'office.arrange.title': 'Arrange',
  'office.arrange.position': 'Position',
  'office.arrange.wrap': 'Wrap Text',
  'office.arrange.align': 'Align',
  'office.arrange.rotate': 'Rotate',
  'office.arrange.selection': 'Selection Pane',
  'office.arrange.topLeft': 'Top left',
  'office.arrange.topCenter': 'Top center',
  'office.arrange.topRight': 'Top right',
  'office.arrange.middleLeft': 'Middle left',
  'office.arrange.middleCenter': 'Middle center',
  'office.arrange.middleRight': 'Middle right',
  'office.arrange.bottomLeft': 'Bottom left',
  'office.arrange.bottomCenter': 'Bottom center',
  'office.arrange.bottomRight': 'Bottom right',
  'office.arrange.x': 'Horizontal offset',
  'office.arrange.y': 'Vertical offset',
  'office.arrange.apply': 'Apply',
  'office.arrange.square': 'Square',
  'office.arrange.tight': 'Tight',
  'office.arrange.through': 'Through',
  'office.arrange.topAndBottom': 'Top and bottom',
  'office.arrange.behind': 'Behind text',
  'office.arrange.front': 'In front of text',
  'office.arrange.left': 'Left',
  'office.arrange.center': 'Center',
  'office.arrange.right': 'Right',
  'office.arrange.top': 'Top',
  'office.arrange.middle': 'Middle',
  'office.arrange.bottom': 'Bottom',
  'office.arrange.group': 'Group',
  'office.arrange.ungroup': 'Ungroup',
  'office.arrange.show': 'Show',
  'office.arrange.hide': 'Hide',
  'office.arrange.noObjects': 'No floating objects',
  'office.arrange.hint': 'Select an object on the page (Ctrl/Shift-click to select more).',
  'office.arrange.shape': 'Shape',
  'office.arrange.image': 'Image',
  'office.arrange.object': 'Object',
};
const vi = {
  'office.rb.bringForward': 'Mang lên trước',
  'office.rb.sendBackward': 'Gửi ra sau',
  'office.rb.selectionPane': 'Ngăn chọn',
  'office.rb.updateIndex': 'Cập nhật chỉ mục',
  'office.arrange.title': 'Sắp xếp',
  'office.arrange.position': 'Vị trí',
  'office.arrange.wrap': 'Bọc văn bản',
  'office.arrange.align': 'Căn chỉnh',
  'office.arrange.rotate': 'Xoay',
  'office.arrange.selection': 'Ngăn chọn',
  'office.arrange.topLeft': 'Trên trái',
  'office.arrange.topCenter': 'Trên giữa',
  'office.arrange.topRight': 'Trên phải',
  'office.arrange.middleLeft': 'Giữa trái',
  'office.arrange.middleCenter': 'Giữa',
  'office.arrange.middleRight': 'Giữa phải',
  'office.arrange.bottomLeft': 'Dưới trái',
  'office.arrange.bottomCenter': 'Dưới giữa',
  'office.arrange.bottomRight': 'Dưới phải',
  'office.arrange.x': 'Dịch ngang',
  'office.arrange.y': 'Dịch dọc',
  'office.arrange.apply': 'Áp dụng',
  'office.arrange.square': 'Vuông',
  'office.arrange.tight': 'Sát',
  'office.arrange.through': 'Xuyên qua',
  'office.arrange.topAndBottom': 'Trên và dưới',
  'office.arrange.behind': 'Sau văn bản',
  'office.arrange.front': 'Trước văn bản',
  'office.arrange.left': 'Trái',
  'office.arrange.center': 'Giữa',
  'office.arrange.right': 'Phải',
  'office.arrange.top': 'Trên',
  'office.arrange.middle': 'Giữa',
  'office.arrange.bottom': 'Dưới',
  'office.arrange.group': 'Nhóm',
  'office.arrange.ungroup': 'Bỏ nhóm',
  'office.arrange.show': 'Hiện',
  'office.arrange.hide': 'Ẩn',
  'office.arrange.noObjects': 'Không có đối tượng nổi',
  'office.arrange.hint': 'Chọn một đối tượng trên trang (Ctrl/Shift-click để chọn nhiều).',
  'office.arrange.shape': 'Hình',
  'office.arrange.image': 'Ảnh',
  'office.arrange.object': 'Đối tượng',
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
