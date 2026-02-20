import {
  DEFAULT_AVATARS,
  getRandomAvatar,
  generateAvatarUrl,
  getAvatarsByCategory,
  isValidAvatarUrl,
  type AvatarConfig,
} from './avatars';

describe('DEFAULT_AVATARS', () => {
  it('has 16 items', () => {
    expect(DEFAULT_AVATARS).toHaveLength(16);
  });

  it('each avatar has id, name, url, and category', () => {
    for (const avatar of DEFAULT_AVATARS) {
      expect(avatar).toHaveProperty('id');
      expect(avatar).toHaveProperty('name');
      expect(avatar).toHaveProperty('url');
      expect(avatar).toHaveProperty('category');
      expect(typeof avatar.id).toBe('string');
      expect(typeof avatar.name).toBe('string');
      expect(typeof avatar.url).toBe('string');
      expect(['animal', 'character', 'abstract']).toContain(avatar.category);
    }
  });

  it('contains all three categories: animal, character, abstract', () => {
    const categories = new Set(DEFAULT_AVATARS.map((a) => a.category));
    expect(categories).toEqual(new Set(['animal', 'character', 'abstract']));
  });

  it('has 6 animal avatars', () => {
    const animals = DEFAULT_AVATARS.filter((a) => a.category === 'animal');
    expect(animals).toHaveLength(6);
  });

  it('has 6 character avatars', () => {
    const characters = DEFAULT_AVATARS.filter((a) => a.category === 'character');
    expect(characters).toHaveLength(6);
  });

  it('has 4 abstract avatars', () => {
    const abstracts = DEFAULT_AVATARS.filter((a) => a.category === 'abstract');
    expect(abstracts).toHaveLength(4);
  });
});

describe('getRandomAvatar', () => {
  it('returns an object with id, name, url, and category', () => {
    const avatar = getRandomAvatar();
    expect(avatar).toHaveProperty('id');
    expect(avatar).toHaveProperty('name');
    expect(avatar).toHaveProperty('url');
    expect(avatar).toHaveProperty('category');
  });

  it('returns an item from DEFAULT_AVATARS', () => {
    const avatar = getRandomAvatar();
    expect(DEFAULT_AVATARS).toContainEqual(avatar);
  });
});

describe('generateAvatarUrl', () => {
  it('returns a DiceBear URL with default style avataaars', () => {
    const url = generateAvatarUrl('test');
    expect(url).toBe('https://api.dicebear.com/7.x/avataaars/svg?seed=test');
  });

  it('uses adventurer style when specified', () => {
    const url = generateAvatarUrl('test', 'adventurer');
    expect(url).toBe('https://api.dicebear.com/7.x/adventurer/svg?seed=test');
  });

  it('uses bottts style when specified', () => {
    const url = generateAvatarUrl('test', 'bottts');
    expect(url).toBe('https://api.dicebear.com/7.x/bottts/svg?seed=test');
  });

  it('encodes special characters in the seed', () => {
    const url = generateAvatarUrl('hello world&foo=bar');
    expect(url).toBe(
      'https://api.dicebear.com/7.x/avataaars/svg?seed=hello%20world%26foo%3Dbar'
    );
  });
});

describe('getAvatarsByCategory', () => {
  it('returns exactly 3 categories', () => {
    const grouped = getAvatarsByCategory();
    expect(Object.keys(grouped)).toHaveLength(3);
  });

  it('animal category has 6 items', () => {
    const grouped = getAvatarsByCategory();
    expect(grouped['animal']).toHaveLength(6);
  });
});

describe('isValidAvatarUrl', () => {
  it('returns true for a DiceBear URL', () => {
    expect(isValidAvatarUrl('https://api.dicebear.com/7.x/avataaars/svg?seed=test')).toBe(true);
  });

  it('returns true for a base64 data URL (png)', () => {
    expect(isValidAvatarUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
  });

  it('returns true for a /avatars/ path', () => {
    expect(isValidAvatarUrl('/avatars/my-avatar.png')).toBe(true);
  });

  it('returns false for a random URL', () => {
    expect(isValidAvatarUrl('https://example.com/image.png')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidAvatarUrl('')).toBe(false);
  });
});
