import Vue from "vue";
import VueRouter from "vue-router";
import HomeView from "../views/HomeView.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/trending/:mediaType/:id",
    name: "trending",
    component: () => import("../components/HomeDetail.vue"),
  },
  {
    path: "/movies",
    name: "movies",
    component: () => import("../components/PopularMovies.vue"),
  },
  {
    path: "/movie/:id",
    name: "movie",
    component: () => import("../components/MovieDetail.vue"),
  },
  {
    path: "/my-view",
    name: "myView",
    component: () => import("../views/MyView.vue"),
  },
  {
    path: "/search",
    name: "search",
    component: () => import("../views/SearchView.vue"),
  },
  {
    path: "/watch/:mediaType/:id",
    name: "watch",
    component: () => import("../views/WatchView.vue"),
    meta: { hideNav: true, hideFooter: true },
  },
  {
    path: "/actor/:id",
    name: "actor",
    component: () => import("../components/ActorDetail.vue"),
  },
  {
    path: "/about",
    name: "about",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
  },
  {
    path: "/shows",
    name: "tvShows",
    component: () => import("../components/TvShows.vue"),
  },
  {
    path: "/show/:id",
    name: "tvShow",
    component: () => import("../components/TvShowDetail.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
