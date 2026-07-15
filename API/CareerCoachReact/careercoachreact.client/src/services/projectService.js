import api from './api'

export const createProject = async (project) => {
    const response = await api.post('/Projects', project)
    return response.data
}

export const getProjectsByUser = async (userId) => {
    const response = await api.get(`/Projects/user/${userId}`)
    return response.data
}