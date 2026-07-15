import api from './api'

export const getSkills = async () => {
    const response = await api.get('/Skills')
    return response.data
}