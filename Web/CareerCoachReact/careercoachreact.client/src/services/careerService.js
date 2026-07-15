import api from './api'

export const selectCareers = async (payload) => {
    const response = await api.post('/UserCareers/select', payload)
    return response.data
}

export const getSelectedCareers = async (userId) => {
    const response = await api.get(`/UserCareers/user/${userId}`)
    return response.data
}