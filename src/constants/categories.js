/**
 * Artist Reference Studio - Categories and Technical Artistic Queries
 */

export const CATEGORIES = [
  { id: 'all', label: 'Todo', query: 'art drawing reference aesthetic' },
  { id: 'anatomy-poses', label: 'Poses & Anatomía', query: 'human anatomy pose model figure drawing reference' },
  { id: 'faces-expressions', label: 'Rostros & Expresiones', query: 'portrait face expression emotion reference character' },
  { id: 'lighting-chiaroscuro', label: 'Iluminación & Claroscuro', query: 'dramatic lighting chiaroscuro shadow portrait studio' },
  { id: 'backgrounds-perspective', label: 'Fondos & Perspectiva', query: 'landscape scenery perspective architecture interior scenery' },
  { id: 'concept-creatures', label: 'Concept Art & Criaturas', query: 'concept art fantasy sci-fi creature monster digital art' },
  { id: 'clothing-drapery', label: 'Ropa & Telas', query: 'clothing drapery folds costume fabric reference garment' },
  { id: 'hands-gestures', label: 'Manos & Gestos', query: 'hands gesture drawing anatomy reference fingers palm' }
];

export const ORIENTATIONS = [
  { id: 'all', label: 'Todas' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'horizontal', label: 'Horizontal' }
];

export const FEATURED_TRENDS = [
  {
    id: 'trend-1',
    title: 'Estudio de Anatomía Dinámica',
    subtitle: 'Poses, escorzo y proporciones',
    category: 'anatomy-poses',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-2',
    title: 'Claroscuro y Luces de Borde (Rim Light)',
    subtitle: 'Iluminación dramática para render',
    category: 'lighting-chiaroscuro',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-3',
    title: 'Retratos, Expresiones y Planos Asimétricos',
    subtitle: 'Emociones y microexpresiones',
    category: 'faces-expressions',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-4',
    title: 'Fondos, Escenarios y Punto de Fuga',
    subtitle: 'Perspectiva de 1, 2 y 3 puntos',
    category: 'backgrounds-perspective',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-5',
    title: 'Pliegues de Ropa y Texturas de Tela',
    subtitle: 'Gravedad, tensión y caída',
    category: 'clothing-drapery',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
  }
];
