# Wedding Jump 設計規範

## 色彩系統

### 主要色彩

| 名稱 | 色碼 | CSS 變數 | 用途 |
|------|------|----------|------|
| Primary | `#f48c25` | `--color-primary` | 主色調、按鈕、強調 |
| Accent Pink | `#ff4d94` | `--color-accent` | CTA 按鈕、重要操作 |

### 背景色彩

| 名稱 | 色碼 | CSS 變數 | 用途 |
|------|------|----------|------|
| Background Light | `#f8f7f5` | `--color-bg-light` | 淺色模式背景 |
| Background Dark | `#221910` | `--color-bg-dark` | 深色模式背景 |

### 遊戲區域色彩

| 區域 | 色碼 | CSS 變數 |
|------|------|----------|
| Zone A (Red) | `#ff4d4d` | `--color-game-red` |
| Zone B (Blue) | `#4d79ff` | `--color-game-blue` |
| Zone C (Yellow) | `#ffcc00` | `--color-game-yellow` |
| Zone D (Green) | `#2ecc71` | `--color-game-green` |

### 文字色彩

| 用途 | 淺色模式 | 深色模式 |
|------|----------|----------|
| 主要文字 | `#1c140d` | `#ffffff` |
| 次要文字 | `#5e442e` | `#9c7349` |
| 輔助文字 | `#9c7349` | `#5e442e` |

## 字體

### 主字體

```css
font-family: 'Spline Sans', sans-serif;
```

**Google Fonts 載入：**
```html
<link href="https://fonts.googleapis.com/css2?family=Spline+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### 字重

| 用途 | 字重 |
|------|------|
| 一般內文 | 400 (Regular) |
| 中等強調 | 500 (Medium) |
| 粗體標題 | 600 (Semi-bold) |
| 特大標題 | 700-800 (Bold/Extra-bold) |

### 字級

| 用途 | 大小 | 行高 |
|------|------|------|
| 超大標題 | 4xl-5xl (36-48px) | 1.1 |
| 大標題 | 2xl-3xl (24-30px) | 1.2 |
| 中標題 | xl (20px) | 1.3 |
| 內文 | base (16px) | 1.5 |
| 小字 | sm (14px) | 1.5 |
| 極小字 | xs (12px) | 1.4 |

## 圖標

使用 Google Material Symbols Outlined：

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
```

常用圖標：
- `favorite` - 愛心
- `celebration` - 慶祝
- `trophy` - 獎盃
- `groups` - 人群
- `timer` - 計時器
- `leaderboard` - 排行榜
- `sports_esports` - 遊戲
- `star` - 星星

## 圓角

| 名稱 | 大小 | 用途 |
|------|------|------|
| Default | `1rem` (16px) | 卡片、按鈕 |
| Large | `2rem` (32px) | 大型容器 |
| XL | `3rem` (48px) | 特大容器 |
| Full | `9999px` | 圓形、膠囊形 |

## 間距

使用 Tailwind 預設間距系統：
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)

## 陰影

```css
/* 輕微陰影 */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

/* 中等陰影 */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

/* 強調陰影 (Primary 色) */
box-shadow: 0 8px 24px rgba(244, 140, 37, 0.4);

/* 發光效果 */
box-shadow: 0 0 40px rgba(244, 140, 37, 0.4);
```

## 玻璃效果

```css
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-dark {
  background: rgba(34, 25, 16, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(244, 140, 37, 0.2);
}
```

## 動畫

### 過渡

```css
transition: all 0.3s ease;
```

### 常用動畫

- `animate-pulse` - 脈衝效果
- `animate-bounce` - 彈跳效果
- `animate-spin` - 旋轉效果

## 響應式斷點

| 名稱 | 寬度 | 用途 |
|------|------|------|
| Mobile | < 640px | 玩家端手機介面 |
| Tablet | 640-1024px | 平板介面 |
| Desktop | > 1024px | 主持人大螢幕 |
| TV/Projector | 16:9 比例 | 投影顯示 |

## 頭像

### 預設頭像

提供 8-12 個可愛動物風格頭像：
- 小狗 (Bubbly Pup)
- 小貓 (Fluffy Kitty)
- 熊貓 (Zen Panda)
- 兔子 (Hopper)
- 等等...

### 頭像尺寸

| 用途 | 尺寸 |
|------|------|
| 排行榜大 | 96-128px |
| 遊戲區域 | 48-64px |
| 列表小 | 32-40px |
| 最小 | 24px |

### 頭像樣式

```css
.avatar {
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.avatar-selected {
  ring: 4px solid var(--color-primary);
}
```
