import { FC, useState, useRef } from 'react';
import { DEFAULT_AVATARS, getAvatarsByCategory } from '../../utils/avatars';
import { useTranslation } from '../../i18n';

interface AvatarSelectorProps {
  selectedAvatar: string | null;
  onSelect: (avatar: string | null) => void;
}

export const AvatarSelector: FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onSelect,
}) => {
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 驗證檔案類型和大小
    if (!file.type.startsWith('image/')) {
      alert(t('avatarSelector.invalidFile'));
      return;
    }
    if (file.size > 500 * 1024) {
      alert(t('avatarSelector.fileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setCustomAvatar(base64);
      onSelect(base64);
    };
    reader.readAsDataURL(file);
  };

  const categories = [
    { id: 'all', name: t('avatarSelector.all'), icon: 'grid_view' },
    { id: 'animal', name: t('avatarSelector.animals'), icon: 'pets' },
    { id: 'character', name: t('avatarSelector.characters'), icon: 'face' },
    { id: 'abstract', name: t('avatarSelector.robots'), icon: 'smart_toy' },
  ];

  const filteredAvatars = activeCategory === 'all'
    ? DEFAULT_AVATARS
    : DEFAULT_AVATARS.filter((a) => a.category === activeCategory);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-2 pb-4">
        <h3 className="text-lg font-bold text-text-primary">{t('avatarSelector.title')}</h3>
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
          {t('avatarSelector.nOptions', { n: filteredAvatars.length })}
        </span>
      </div>

      {/* 類別選擇 */}
      <div className="flex gap-2 px-2 pb-4 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
              ${activeCategory === cat.id
                ? 'bg-primary text-white'
                : 'bg-white/60 text-text-muted hover:bg-white/80'}
            `}
          >
            <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* 水平捲動區域 */}
      <div className="flex overflow-x-auto gap-4 px-2 py-4 no-scrollbar">
        {/* 自訂上傳選項 */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`
              w-20 h-20 rounded-full bg-white p-0.5 shadow-md overflow-hidden
              flex items-center justify-center
              ${customAvatar && selectedAvatar === customAvatar
                ? 'ring-4 ring-primary scale-105'
                : 'ring-2 ring-primary/20'}
              transition-all hover:ring-primary/40
            `}
          >
            {customAvatar ? (
              <img src={customAvatar} alt="Custom" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="flex flex-col items-center text-text-muted">
                <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              </div>
            )}
          </button>
          <span className={`text-xs text-center ${
            customAvatar && selectedAvatar === customAvatar
              ? 'font-bold text-text-primary'
              : 'font-medium text-text-muted'
          }`}>
            {customAvatar ? t('avatarSelector.myPhoto') : t('avatarSelector.upload')}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* 預設頭像 */}
        {filteredAvatars.map((avatar) => (
          <div
            key={avatar.id}
            className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => onSelect(avatar.url)}
          >
            <div
              className={`
                w-20 h-20 rounded-full bg-white p-0.5 shadow-md overflow-hidden
                ${selectedAvatar === avatar.url
                  ? 'ring-4 ring-primary scale-105'
                  : 'ring-2 ring-primary/20'}
                transition-all hover:ring-primary/40
              `}
            >
              <img
                src={avatar.url}
                alt={avatar.name}
                className="w-full h-full rounded-full bg-gray-100"
                loading="lazy"
              />
            </div>
            <span className={`text-xs text-center truncate max-w-[80px] ${
              selectedAvatar === avatar.url
                ? 'font-bold text-text-primary'
                : 'font-medium text-text-muted'
            }`}>
              {avatar.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
