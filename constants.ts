
import type { Level } from './types';
import { LevelType, Difficulty, Subject, PreschoolSubject } from './types';

export const LEVELS: Level[] = [
  {
    type: LevelType.CLICK_BASIC,
    subject: Subject.CLICKING,
    title: 'Click Thần Tốc',
    description: 'Click thật nhanh trước khi hết giờ!',
    difficulties: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD],
  },
  {
    type: LevelType.CLICK_TARGET,
    subject: Subject.CLICKING,
    title: 'Tìm Mục Tiêu',
    description: 'Click vào con vật có số được yêu cầu.',
    difficulties: [Difficulty.EASY],
  },
  {
    type: LevelType.MATH_ADD_SUBTRACT,
    subject: Subject.MATH,
    title: 'Toán Cộng Trừ',
    description: 'Làm các phép toán cộng trừ.',
    difficulties: [Difficulty.EASY, Difficulty.HARD],
  },
  {
    type: LevelType.VIETNAMESE_FILL_WORD,
    subject: Subject.VIETNAMESE,
    title: 'Điền Từ',
    description: 'Nhìn hình và điền chữ còn thiếu.',
    difficulties: [Difficulty.EASY],
  },
  {
    type: LevelType.VIETNAMESE_SCRAMBLE_WORD,
    subject: Subject.VIETNAMESE,
    title: 'Sắp Xếp Câu',
    description: 'Sắp xếp các từ thành câu đúng.',
    difficulties: [Difficulty.EASY, Difficulty.HARD],
  },
  {
    type: LevelType.VIETNAMESE_RHYME_MATCH,
    subject: Subject.VIETNAMESE,
    title: 'Tìm Vần',
    description: 'Tìm từ có vần giống với từ cho sẵn.',
    difficulties: [Difficulty.EASY, Difficulty.HARD],
  },
  {
    type: LevelType.ENGLISH_FILL_WORD,
    subject: Subject.ENGLISH,
    title: 'Fill Blank',
    description: 'Điền chữ cái còn thiếu vào từ.',
    difficulties: [Difficulty.EASY, Difficulty.MEDIUM],
  },
  {
    type: LevelType.ENGLISH_LISTEN_TYPE,
    subject: Subject.ENGLISH,
    title: 'Listen & Type',
    description: 'Nghe và gõ lại từ đúng.',
    difficulties: [Difficulty.EASY, Difficulty.MEDIUM],
  },
    {
    type: LevelType.ENGLISH_IMAGE_WORD_MATCH,
    subject: Subject.ENGLISH,
    title: 'Image & Word',
    description: 'Chọn đúng từ cho hình ảnh.',
    difficulties: [Difficulty.EASY, Difficulty.MEDIUM],
  },
  {
    type: LevelType.ENGLISH_LISTEN_FILL_SENTENCE,
    subject: Subject.ENGLISH,
    title: 'Listen & Fill Sentence',
    description: 'Nghe và điền từ còn thiếu vào câu.',
    difficulties: [Difficulty.EASY, Difficulty.MEDIUM],
  },
  {
    type: LevelType.TYPING_BASIC,
    subject: Subject.TYPING,
    title: 'Gõ Phím Cơ Bản',
    description: 'Luyện gõ các ký tự trên bàn phím.',
    difficulties: [Difficulty.EASY],
  },
  {
    type: LevelType.TYPING_VIETNAMESE_VOWELS,
    subject: Subject.TYPING,
    title: 'Gõ Dấu Tiếng Việt',
    description: 'Học cách gõ chữ và dấu tiếng Việt.',
    difficulties: [Difficulty.EASY],
  },
];

export const PRESCHOOL_LEVELS: Level[] = [
  {
    type: LevelType.PRESCHOOL_COLORS,
    subject: PreschoolSubject.COLORS,
    title: 'Màu Sắc',
    description: 'Bé học về các màu sắc cơ bản.',
    difficulties: [Difficulty.EASY],
  },
  {
    type: LevelType.PRESCHOOL_ANIMALS,
    subject: PreschoolSubject.ANIMALS,
    title: 'Con Vật',
    description: 'Nhận biết các con vật quen thuộc.',
    difficulties: [Difficulty.EASY],
  },
  {
    type: LevelType.PRESCHOOL_OBJECTS,
    subject: PreschoolSubject.OBJECTS,
    title: 'Đồ Vật',
    description: 'Gọi tên những đồ vật quanh bé.',
    difficulties: [Difficulty.EASY],
  },
  {
    type: LevelType.PRESCHOOL_SHAPES,
    subject: PreschoolSubject.SHAPES,
    title: 'Hình Dạng',
    description: 'Khám phá thế giới hình dạng.',
    difficulties: [Difficulty.EASY],
  },
  {
    type: LevelType.PRESCHOOL_COUNTING,
    subject: PreschoolSubject.COUNTING,
    title: 'Đếm Số',
    description: 'Tập đếm số từ 1 đến 10.',
    difficulties: [Difficulty.EASY],
  },
];

// Dữ liệu game đơn giản, có thể giữ lại
export const CLICK_EMOJIS = [
  '⚽️', '🍎', '⭐', '🚗', '🎈', '🎁', '🐶', '🐱', '🌷', '🌞', '💎', '🍔', '🍕', '🍓', '🍉', '🍍',
  '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐢', '🦎', '🐍',
  '🐴', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐏', '🐑', '🐐', '🐪', '🐫',
  '🕊️', '🦢', '🦜', '🧜‍♀️', '🧜‍♂️', '👖', '👕', '👗', '🏠', '🏰', '✈️', '🚀', '🚁', '🎸', '🎹', '🎺',
  '🥁', '📱', '💻', '🖥️', '⌚️', '⏰', '💡', '🔦', '🔨', '🛠️', '🔑', '🔒', '🔓', '🔔', '📚', '📖',
  '📝', '✏️', '🖍️', '🖌️', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '💰', '💵', '💶', '👑', '🎩',
  '🎓', '💄', '💍', '💼', '☂️', '🌂', '🌈', '🌍', '🌎', '🌏', '🌕', '🌖', '🌗', '🏀', '🏐', '🏈',
  '⚾️', '🎾', '🎱', '♟️', '🎲', '🎳', '🥊', '🥋', '🥅', '⛳️', '⛸️', '🎣', '🎽', '🎿', '⛷️', '🏂',
  '🤺', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️',
];
export const TARGET_EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️'];