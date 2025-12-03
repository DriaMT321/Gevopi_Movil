import adminLteColors from './adminLteTheme';
import spacing from './spacing';
import typography from './typography';

export const theme = {
  colors: adminLteColors,
  spacing,
  typography,
  
  // Sombras (estilo AdminLTE)
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export { adminLteColors, spacing, typography };
export default theme;

