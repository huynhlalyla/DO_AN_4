import { createWebHistory, createRouter } from 'vue-router'
//Layouts
import MainLayout from '../views/layouts/MainLayout.vue'
//Pages
import HomeView from "../views/pages/HomeView.vue"
import MoreView from '../views/pages/MoreView.vue'
import AboutView from '../views/pages/AboutView.vue'

const routes = [
  { 
    path: '/', 
    component: MainLayout, 
    children: [
        {
            path: '',
            component: HomeView
        }
    ]
  },
  { 
    path: '/about', 
    component: MainLayout,
    children:  [
        {
            path: '',
            component: AboutView
        },
        {
            path: 'more',
            component: MoreView
        }
    ] 
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})