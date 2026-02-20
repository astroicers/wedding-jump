// 預設頭像配置
// 使用 DiceBear API 生成可愛的頭像

export interface AvatarConfig {
  id: string;
  name: string;
  url: string;
  category: 'animal' | 'character' | 'abstract';
}

// 預設頭像列表 - 使用 DiceBear Avataaars 和 Bottts 風格
export const DEFAULT_AVATARS: AvatarConfig[] = [
  // 動物風格 (Adventurer)
  { id: 'cat', name: 'Cat', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix', category: 'animal' },
  { id: 'dog', name: 'Dog', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Buddy', category: 'animal' },
  { id: 'bunny', name: 'Bunny', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bunny', category: 'animal' },
  { id: 'bear', name: 'Bear', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bear', category: 'animal' },
  { id: 'panda', name: 'Panda', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Panda', category: 'animal' },
  { id: 'fox', name: 'Fox', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Fox', category: 'animal' },

  // 人物風格 (Avataaars)
  { id: 'happy', name: 'Happy', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Happy', category: 'character' },
  { id: 'cool', name: 'Cool', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cool', category: 'character' },
  { id: 'chill', name: 'Chill', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chill', category: 'character' },
  { id: 'sunny', name: 'Sunny', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sunny', category: 'character' },
  { id: 'luna', name: 'Luna', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna', category: 'character' },
  { id: 'star', name: 'Star', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Star', category: 'character' },

  // 機器人風格 (Bottts)
  { id: 'bot1', name: 'Beep', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Beep', category: 'abstract' },
  { id: 'bot2', name: 'Boop', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Boop', category: 'abstract' },
  { id: 'bot3', name: 'Zap', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zap', category: 'abstract' },
  { id: 'bot4', name: 'Pixel', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pixel', category: 'abstract' },
];

// 獲取隨機頭像
export function getRandomAvatar(): AvatarConfig {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
}

// 根據名稱生成一致的頭像 URL
export function generateAvatarUrl(seed: string, style: 'adventurer' | 'avataaars' | 'bottts' = 'avataaars'): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

// 獲取依類別分組的頭像
export function getAvatarsByCategory(): Record<string, AvatarConfig[]> {
  return DEFAULT_AVATARS.reduce((acc, avatar) => {
    if (!acc[avatar.category]) {
      acc[avatar.category] = [];
    }
    acc[avatar.category].push(avatar);
    return acc;
  }, {} as Record<string, AvatarConfig[]>);
}

// 驗證是否為有效的頭像 URL
export function isValidAvatarUrl(url: string): boolean {
  // 允許 DiceBear API 和本地上傳的圖片
  const validPatterns = [
    /^https:\/\/api\.dicebear\.com\//,
    /^\/avatars\//,
    /^data:image\/(png|jpeg|gif|webp);base64,/,
  ];
  return validPatterns.some((pattern) => pattern.test(url));
}
