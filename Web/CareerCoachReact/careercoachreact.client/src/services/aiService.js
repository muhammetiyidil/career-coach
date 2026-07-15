import api from './api'

export const analyzeUserSkills = async (payload) => {
    const response = await api.post('/SkillAnalyzer/analyze', payload)
    return response.data
}

export const getCareerRecommendations = async (userId) => {
    const response = await api.get(`/CareerMatch/${userId}`)
    return response.data
}

export const getMlCareerPrediction = async (userId) => {
    const response = await api.post(`/SkillAnalyzer/ml-predict/${userId}`)
    return response.data
}

export const getSimilarityCareerPrediction = async (userId) => {
    const response = await api.post(
        `/SkillAnalyzer/similarity-predict/${userId}`
    )
    return response.data
}

export const completeLearningTask = async (payload) => {
    const response = await api.post('/LearningProgress/complete', payload)
    return response.data
}

export const getRoadmapStates = async (userId) => {
    const response = await api.get(`/RoadmapState/user/${userId}`)
    return response.data
}

export const saveRoadmapState = async (payload) => {
    const response = await api.post('/RoadmapState/save', payload)
    return response.data
}