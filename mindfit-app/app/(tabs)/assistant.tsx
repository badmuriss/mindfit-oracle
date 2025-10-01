import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';
import { API_ENDPOINTS } from '../../constants/Api';

const { width: screenWidth } = Dimensions.get('window');

type RecommendationAction = {
  type: 'ADD_WORKOUT' | 'ADD_MEAL';
  title: string;
  description: string;
  workoutData?: {
    name: string;
    description: string;
    durationInMinutes: number;
    caloriesBurnt: number;
  };
  mealData?: {
    name: string;
    calories: number;
    carbo: number;
    protein: number;
    fat: number;
  };
};

type Message = {
  from: 'user' | 'bot';
  text: string;
  actions?: RecommendationAction[];
  actionStates?: { [index: number]: 'idle' | 'loading' | 'success' | 'error' };
};

export default function AssistantScreen() {
  const { token, userId } = useUser();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { from: 'user', text: userText }]);
    setInput('');
    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }
    setSending(true);
    try {
      const resp = await fetch(API_ENDPOINTS.USERS.CHATBOT(userId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: userText }),
      });
      if (!resp.ok) {
        showMessage({ message: 'Erro no chatbot.', type: 'danger' });
        setSending(false);
        return;
      }
      const data = await resp.json();
      const botText = data.response || 'Desculpe, não entendi.';
      const actions = data.actions || undefined;

      const botMessage: Message = {
        from: 'bot',
        text: botText,
        actions,
        actionStates: actions ? actions.reduce((acc: any, _: any, index: number) => {
          acc[index] = 'idle';
          return acc;
        }, {}) : undefined
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.log('Chatbot error:', err);
      showMessage({ message: 'Erro ao conectar com o chatbot.', type: 'danger' });
    } finally {
      setSending(false);
    }
  };

  const executeAction = async (messageIndex: number, actionIndex: number, action: RecommendationAction) => {
    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }

    // Update action state to loading
    setMessages(prev => prev.map((msg, mIndex) => {
      if (mIndex === messageIndex && msg.actionStates) {
        return {
          ...msg,
          actionStates: {
            ...msg.actionStates,
            [actionIndex]: 'loading'
          }
        };
      }
      return msg;
    }));

    try {
      const resp = await fetch(API_ENDPOINTS.USERS.CHATBOT_ACTIONS(userId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(action),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      // Update action state to success
      setMessages(prev => prev.map((msg, mIndex) => {
        if (mIndex === messageIndex && msg.actionStates) {
          return {
            ...msg,
            actionStates: {
              ...msg.actionStates,
              [actionIndex]: 'success'
            }
          };
        }
        return msg;
      }));

      const actionType = action.type === 'ADD_WORKOUT' ? 'treino' : 'refeição';
      showMessage({
        message: `${actionType} adicionado com sucesso!`,
        type: 'success'
      });

    } catch (err) {
      console.log('Action execution error:', err);

      // Update action state to error
      setMessages(prev => prev.map((msg, mIndex) => {
        if (mIndex === messageIndex && msg.actionStates) {
          return {
            ...msg,
            actionStates: {
              ...msg.actionStates,
              [actionIndex]: 'error'
            }
          };
        }
        return msg;
      }));

      showMessage({
        message: 'Erro ao executar ação. Tente novamente.',
        type: 'danger'
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={32} color="#8b5cf6" />
        <Text style={styles.title}>Assistente MindFit</Text>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index: messageIndex }) => (
          <View>
            <View style={[styles.msg, item.from === 'user' ? styles.msgUser : styles.msgBot]}>
              <Text style={[styles.msgText, item.from === 'user' && { color: '#fff', fontWeight: '600' }]}>{item.text}</Text>
            </View>
            {item.from === 'bot' && item.actions && item.actions.length > 0 && (
              <View style={styles.actionsContainer}>
                {item.actions.map((action, actionIndex) => {
                  const actionState = item.actionStates?.[actionIndex] || 'idle';
                  const isWorkout = action.type === 'ADD_WORKOUT';
                  const data = isWorkout ? action.workoutData : action.mealData;

                  return (
                    <View key={actionIndex} style={styles.actionCard}>
                      <View style={styles.actionHeader}>
                        <MaterialCommunityIcons
                          name={isWorkout ? "dumbbell" : "food"}
                          size={24}
                          color={isWorkout ? "#22c55e" : "#f59e0b"}
                        />
                        <Text style={styles.actionTitle}>{action.title}</Text>
                      </View>

                      <Text style={styles.actionDescription}>{action.description}</Text>

                      {data && (
                        <View style={styles.actionData}>
                          <Text style={styles.actionDataTitle}>{data.name}</Text>
                          <View style={styles.actionDataRow}>
                            {isWorkout ? (
                              <>
                                <Text style={styles.actionDataText}>⏱️ {action.workoutData?.durationInMinutes} min</Text>
                                <Text style={styles.actionDataText}>🔥 {action.workoutData?.caloriesBurnt} kcal</Text>
                              </>
                            ) : (
                              <>
                                <Text style={styles.actionDataText}>🔥 {action.mealData?.calories} kcal</Text>
                                <Text style={styles.actionDataText}>C: {action.mealData?.carbo}g</Text>
                                <Text style={styles.actionDataText}>P: {action.mealData?.protein}g</Text>
                                <Text style={styles.actionDataText}>G: {action.mealData?.fat}g</Text>
                              </>
                            )}
                          </View>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          actionState === 'success' && styles.actionButtonSuccess,
                          actionState === 'error' && styles.actionButtonError,
                          actionState === 'loading' && styles.actionButtonLoading
                        ]}
                        onPress={() => executeAction(messageIndex, actionIndex, action)}
                        disabled={actionState === 'loading' || actionState === 'success'}
                      >
                        {actionState === 'loading' ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : actionState === 'success' ? (
                          <>
                            <MaterialCommunityIcons name="check" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Adicionado!</Text>
                          </>
                        ) : actionState === 'error' ? (
                          <>
                            <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Tentar Novamente</Text>
                          </>
                        ) : (
                          <>
                            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>
                              {isWorkout ? 'Adicionar aos Treinos' : 'Adicionar às Refeições'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={[styles.messagesList, messages.length === 0 && { justifyContent: 'center', alignItems: 'center' }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="chatbubbles-outline" size={80} color="#cbd5e1" />
            <Text style={{ 
              color: '#64748b', 
              marginTop: 20, 
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '700',
            }}>
              Olá! Como posso ajudar?
            </Text>
            <Text style={{ 
              color: '#94a3b8', 
              marginTop: 8, 
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '500',
              maxWidth: 280,
              lineHeight: 22,
            }}>
              Faça perguntas sobre treinos, nutrição ou qualquer dúvida sobre fitness
            </Text>
          </View>
        }
      />
      
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput 
            value={input} 
            onChangeText={setInput} 
            style={styles.input} 
            placeholder="Faça uma pergunta ao assistente..." 
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]} 
            onPress={sendMessage} 
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: screenWidth <= 400 ? 16 : 24,
    paddingTop: screenWidth <= 400 ? 16 : 20,
    paddingBottom: screenWidth <= 400 ? 16 : 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  title: { 
    fontSize: 26, 
    fontWeight: '900', 
    marginLeft: 16,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  messagesList: {
    padding: 24,
    paddingBottom: 20,
    flexGrow: 1,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 4,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end',
    gap: 16,
  },
  input: { 
    flex: 1, 
    borderWidth: 2, 
    borderColor: '#cbd5e1', 
    borderRadius: 20, 
    padding: 18,
    paddingTop: 18,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#ffffff',
    maxHeight: 120,
    color: '#0f172a',
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: '#8b5cf6',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  msg: { 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 16, 
    maxWidth: '85%',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  msgUser: { 
    backgroundColor: '#8b5cf6', 
    alignSelf: 'flex-end',
    borderBottomRightRadius: 8,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.3,
  },
  msgBot: { 
    backgroundColor: '#ffffff', 
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  msgText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0f172a',
    fontWeight: '500',
  },
  // Action styles
  actionsContainer: {
    marginVertical: 12,
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginLeft: 20,
    marginRight: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 12,
    flex: 1,
  },
  actionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '500',
  },
  actionData: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  actionDataTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  actionDataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionDataText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonSuccess: {
    backgroundColor: '#22c55e',
  },
  actionButtonError: {
    backgroundColor: '#ef4444',
  },
  actionButtonLoading: {
    backgroundColor: '#64748b',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
