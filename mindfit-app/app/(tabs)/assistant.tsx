import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';

export default function AssistantScreen() {
  const { token, userId } = useUser();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
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
      const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}/chatbot`, {
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
      setMessages(prev => [...prev, { from: 'bot', text: botText }]);
    } catch (err) {
      console.log('Chatbot error:', err);
      showMessage({ message: 'Erro ao conectar com o chatbot.', type: 'danger' });
    } finally {
      setSending(false);
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
        renderItem={({ item }) => (
          <View style={[styles.msg, item.from === 'user' ? styles.msgUser : styles.msgBot]}>
            <Text style={[styles.msgText, item.from === 'user' && { color: '#fff', fontWeight: '600' }]}>{item.text}</Text>
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
    padding: 24,
    paddingTop: 20,
    paddingBottom: 20,
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
});
