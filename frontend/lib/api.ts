import axios, { AxiosInstance } from 'axios'
import { AuthResponse, User } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

class APIClient {
  public client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
  }

  // Auth endpoints
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const { data } = await this.client.post('/api/auth/register', {
      email,
      password,
      name,
    })
    return data
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.client.post('/api/auth/login', {
      email,
      password,
    })
    return data
  }

  async guestRegister(name: string): Promise<AuthResponse> {
    const { data } = await this.client.post('/api/auth/guest', {
      name,
    })
    return data
  }

  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout')
  }

  async refreshToken(): Promise<AuthResponse> {
    const { data } = await this.client.post('/api/auth/refresh')
    return data
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get('/api/auth/me')
    return data
  }

  // Interview endpoints
  async getInterviews() {
    const { data } = await this.client.get('/api/interviews')
    return data
  }

  async getInterview(id: string) {
    const { data } = await this.client.get(`/api/interviews/${id}`)
    return data
  }

  async createInterview(interview: any) {
    const { data } = await this.client.post('/api/interviews', interview)
    return data
  }

  async updateInterview(id: string, interview: any) {
    const { data } = await this.client.put(`/api/interviews/${id}`, interview)
    return data
  }

  async deleteInterview(id: string) {
    await this.client.delete(`/api/interviews/${id}`)
  }

  // Room endpoints
  async joinRoom(roomId: string, password: string) {
    const { data } = await this.client.post('/api/rooms/join', {
      roomId,
      password,
    })
    return data
  }

  async getRoom(roomId: string) {
    const { data } = await this.client.get(`/api/rooms/${roomId}`)
    return data
  }
}

export const apiClient = new APIClient()
