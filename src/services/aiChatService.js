// ==========================================================
// TYPE MASTER AI ASSISTANT CHAT SERVICE
// Client Service connecting to Backend Gemini API
// ==========================================================

export const aiChatService = {
  /**
   * Send a conversation turn to TypeMaster AI Assistant
   */
  async sendMessage({ messages = [], userRole = 'user', portal = 'user', userProfile = null }) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          userRole,
          portal,
          userProfile
        }),
        signal: AbortSignal.timeout(18000)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || data.message || `Error (${response.status}): Failed to get AI response.`
        };
      }

      return {
        success: true,
        reply: data.reply,
        modelUsed: data.modelUsed
      };
    } catch (err) {
      if (err.name === 'TimeoutError') {
        return {
          success: false,
          error: 'TypeMaster AI is taking longer than usual to respond. Please retry your question.'
        };
      }
      return {
        success: false,
        error: err.message || 'Unable to connect to TypeMaster AI. Please check your network connection.'
      };
    }
  },

  /**
   * Query the server's Gemini configuration status (returns masked key & active model)
   */
  async getStatus() {
    try {
      const response = await fetch('/api/typing/gemini-status');
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback
    }
    return { success: false, isConfigured: false, model: 'gemini-3.5-flash', maskedKey: '' };
  }
};

export default aiChatService;
