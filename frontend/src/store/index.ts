import { createStore } from 'vuex'
import { eventTypes } from "@/interfaces/event_types";
import router from '@/router'

export default createStore({
  state: {
    socket: null as null | WebSocket,
    clientInfo: null as any
  },
  getters: {
    getSocket(state) {
      return state.socket
    },
    getClientInfo(state) {
      return state.clientInfo
    }
  },
  mutations: {
    setSocket(state, socket) {
      state.socket = socket
    },
    setClientInfo(state, clientInfo) {
      state.clientInfo = clientInfo
    }
  },
  actions: {
    initializeSocket({ commit, getters }) {
      return new Promise((resolve, reject) => {
        try {
          const server = window.location.hostname === 'localhost' ? 'ws://localhost:3000' : 'wss://dewdle.herokuapp.com/'
          commit('setSocket', new WebSocket(server))
          getters.getSocket.onclose = (e: any) => {
            router.push("/");
          }
          getters.getSocket.onopen = (e: any) => {
            getters.getSocket.send(JSON.stringify({ type: eventTypes.GET_CLIENT_INFO, clientId: getters.getClientInfo ? getters.getClientInfo.id : null }))
            resolve(e)
          }
        } catch (e) {
          reject(e)
        }
      })
    }
  },
})
