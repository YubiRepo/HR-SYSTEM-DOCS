import DefaultTheme from 'vitepress/theme'
import ModuleCard from './components/ModuleCard.vue'
import './styles/custom.css'
import './styles/hr-theme.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ModuleCard', ModuleCard)
  },
}
