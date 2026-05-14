export async function createConversationService(question){
    try {
        return `chat saved to db ${question}`
    } catch (error) {
        throw error
    }
}