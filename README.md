# 🎮 Snake & Chess Game 

A web-based game collection featuring two classic games: Snake and Chess, built with vanilla HTML, CSS, and JavaScript.

## 🎯 Features

### 🐍 Snake Game
- Classic snake gameplay with arrow key controls
- Score tracking system
- Collision detection (walls and self-collision)
- Food generation at random positions
- Game over detection with score display
- Responsive canvas-based rendering
- **Mobile-optimized**: Fully responsive design for Android phones

### ♟️ Chess Game
- Complete chess implementation from scratch (no external libraries)
- Play against AI with three difficulty levels:
  - **Easy**: Random moves
  - **Medium**: Minimax algorithm with depth 2
  - **Hard**: Minimax algorithm with depth 3
- Full chess rules implementation:
  - Castling (kingside and queenside)
  - En passant captures
  - Pawn promotion with choice of piece
  - Check and checkmate detection
  - Stalemate detection
- Game controls:
  - Reset game
  - Undo moves
  - Flip board perspective
  - Toggle promotion prompt
- Move history display
- Visual highlighting of legal moves
- **Mobile-optimized**: Responsive design for Android phones with touch-friendly controls

## 📱 Mobile Optimization

This project includes comprehensive media queries for Android phone sizes:

### Supported Screen Sizes:
- **Large phones**: Up to 480px width
- **Medium phones**: Up to 360px width  
- **Small phones**: Up to 320px width
- **Landscape mode**: Special optimizations for horizontal orientation

### Mobile Features:
- Responsive layouts that adapt to different screen sizes
- Touch-friendly button sizes and spacing
- Optimized canvas sizes for mobile displays
- Landscape mode support with rearranged layouts
- Touch device-specific optimizations

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required - runs directly in the browser
- **Mobile compatible**: Works on Android phones and tablets

### How to Play

1. **Open the main menu**: Open `index.html` in your web browser
2. **Choose a game**: Click on either "🐍 Play Snake" or "♟️ Play Chess"
3. **Enjoy!** Both games are ready to play immediately on desktop or mobile

### Snake Game Controls
- **Arrow Up**: Move up
- **Arrow Down**: Move down  
- **Arrow Left**: Move left
- **Arrow Right**: Move right
- **Touch controls**: Use on-screen keyboard on mobile devices

### Chess Game Controls
- **Click/Tap**: Select pieces and make moves
- **Reset Button**: Start a new game
- **Undo Button**: Take back the last move
- **Flip Button**: Change board perspective
- **Difficulty Select**: Choose AI difficulty level
- **Promotion Checkbox**: Toggle promotion prompt

## 🏗️ Project Structure

```
Snake-Chess-Game/
├── index.html          # Main menu page
├── style.css           # Main menu styling with mobile media queries
├── README.md           # This file
├── chess/
│   ├── chess.html      # Chess game page
│   ├── chess.css       # Chess game styling with mobile media queries
│   └── chess.js        # Chess game logic (complete implementation)
└── snake/
    ├── snake.html      # Snake game page
    ├── snake.css       # Snake game styling with mobile media queries
    └── snake.js        # Snake game logic
```

## 🛠️ Technical Details

### Chess Implementation
- **Board Representation**: 8x8 array with piece objects
- **Move Generation**: Complete legal move generation including special moves
- **AI Engine**: Minimax algorithm with alpha-beta pruning
- **Evaluation**: Material-based evaluation with piece values
- **Rules**: Full chess rules including castling, en passant, and promotion
- **Mobile Support**: Touch-optimized interface with responsive board sizing

### Snake Implementation
- **Canvas-based**: Uses HTML5 Canvas for rendering
- **Game Loop**: setInterval-based game loop at 100ms intervals
- **Collision Detection**: Wall and self-collision detection
- **Random Food**: Random food generation with collision avoidance
- **Mobile Support**: Responsive canvas sizing for different screen sizes

## 🎨 Design Features

- **Responsive Design**: Works on desktop, tablets, and mobile devices
- **Modern UI**: Clean, modern interface with smooth animations
- **Visual Feedback**: Highlighting, hover effects, and clear status messages
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **Touch Optimization**: Larger touch targets for mobile devices

## 🔧 Customization

You can easily customize:
- Game speeds (modify interval timers)
- AI difficulty (adjust minimax depth)
- Visual themes (modify CSS variables)
- Board sizes and piece values
- Mobile breakpoints in CSS media queries

## 📱 Browser Compatibility

Tested and works on:
- Chrome 90+ (Desktop & Mobile)
- Firefox 88+ (Desktop & Mobile)
- Safari 14+ (Desktop & Mobile)
- Edge 90+ (Desktop & Mobile)
- Android Browser
- Mobile Chrome

## 🤝 Contributing

Feel free to contribute by:
- Reporting bugs
- Suggesting new features
- Improving the AI algorithm
- Adding new games to the collection
- Enhancing the UI/UX
- Improving mobile responsiveness

## 📄 License

This project is open source and available under the MIT License.

