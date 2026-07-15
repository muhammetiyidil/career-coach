import api from './api'

export const createExperience = async (experience) => {
    const response = await api.post('/Experiences', experience)
    return response.data
}

export const getExperiencesByUser = async (userId) => {
    const response = await api.get(`/Experiences/user/${userId}`)
    return response.data
}