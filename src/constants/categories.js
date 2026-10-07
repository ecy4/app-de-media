/**
 * LayoutHub - Categories and Technical Query Constants for Graphic Designers
 */

export const CATEGORIES = [
  { id: 'all', label: 'Todo', query: 'graphic design branding visual layout' },
  { id: 'branding-logos', label: 'Branding & Logos', query: 'minimalist logo branding visual identity design mockup' },
  { id: 'mockups-packaging', label: 'Mockups & Packaging', query: 'packaging box product branding mockup stationery' },
  { id: 'typography-posters', label: 'Tipografía & Posters', query: 'typography swiss poster editorial layout print design' },
  { id: 'ui-web', label: 'UI & Web Design', query: 'ui ux web design app interface clean layout' },
  { id: 'editorial-magazines', label: 'Editorial & Revistas', query: 'magazine editorial layout editorial design book' },
  { id: 'palettes-gradients', label: 'Paletas & Gradientes', query: 'abstract gradient background minimal color palette' },
  { id: 'textures-backdrops', label: 'Texturas & Fondos', query: 'clean studio backdrop paper texture marble background' }
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
    category: 'branding-logos',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-2',
    title: 'Packaging Minimalista & Cajas 3D',
    subtitle: 'Mockups de producto y render fotorrealista',
    category: 'mockups-packaging',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-3',
    title: 'Diseño Editorial & Estilo Suizo',
    subtitle: 'Grillas tipográficas y posters',
    category: 'typography-posters',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-4',
    title: 'Interfaces Móviles & Diseño Web Limpio',
    subtitle: 'UI Kits, componentes y microinteracciones',
    category: 'ui-web',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'trend-5',
    title: 'Gradientes Líquidos & Paletas Cromáticas',
    subtitle: 'Texturas holográficas y colores contemporáneos',
    category: 'palettes-gradients',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80'
  }
];
