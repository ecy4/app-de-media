/**
 * LayoutHub - Categories and Technical Query Constants for Graphic Designers
 * Strict hierarchical order and clean identifiers
 */

export const CATEGORIES = [
  { id: 'all', label: 'Todo', query: 'graphic design visual inspiration' },
  { id: 'branding', label: 'Branding & Logos', query: 'minimalist logo branding visual identity mockup' },
  { id: 'mockups', label: 'Mockups & Packaging', query: 'packaging box product branding mockup stationery' },
  { id: 'typography', label: 'Tipografía & Posters', query: 'swiss typography poster editorial layout print' },
  { id: 'ui', label: 'UI & Web Design', query: 'ui ux web design app interface clean layout' },
  { id: 'editorial', label: 'Editorial & Libros', query: 'magazine editorial layout book design print' },
  { id: 'palettes', label: 'Paletas & Gradientes', query: 'abstract gradient background minimal color palette' },
  { id: 'textures', label: 'Texturas & Fondos', query: 'clean studio backdrop paper texture marble background' }
];

export const ORIENTATIONS = [
  { id: 'all', label: 'Todas' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'horizontal', label: 'Horizontal' }
];

export const FEATURED_TRENDS = [
  {
    id: 'trend-1',
    title: 'Identidad Visual & Papelería Corporativa',
    subtitle: 'Branding de alta gama y papelería',
    category: 'branding',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-2',
    title: 'Packaging Minimalista & Cajas 3D',
    subtitle: 'Mockups de producto y render fotorrealista',
    category: 'mockups',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-3',
    title: 'Diseño Editorial & Estilo Suizo',
    subtitle: 'Grillas tipográficas y posters',
    category: 'typography',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-4',
    title: 'Interfaces Móviles & Diseño Web Limpio',
    subtitle: 'UI Kits, componentes y microinteracciones',
    category: 'ui',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-5',
    title: 'Gradientes Líquidos & Paletas Cromáticas',
    subtitle: 'Texturas holográficas y colores contemporáneos',
    category: 'palettes',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80'
  }
];
