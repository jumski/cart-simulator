import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { gameState } from './lib/GameState'

// For debugging
console.log('Starting the app')
gameState.subscribe(state => {
  console.log('GameState updated:', state)
})

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
