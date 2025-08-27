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
        <Ionicons name="chatbubbles" size={28} color="#0ea5e9" />
        <Text style={styles.title}>Assistente MindFit</Text>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[styles.msg, item.from === 'user' ? styles.msgUser : styles.msgBot]}>
            <Text style={[styles.msgText, item.from === 'user' && { color: '#fff' }]}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput 
            value={input} 
            onChangeText={setInput} 
            style={styles.input} 
            placeholder="Diga algo ao assistente..." 
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
              <Ionicons name="send" size={20} color="#fff" />
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    marginLeft: 12,
    color: '#1e293b',
  },
  messagesList: {
    padding: 20,
    paddingBottom: 16,
    flexGrow: 1,
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end',
    gap: 12,
  },
  input: { 
    flex: 1, 
    borderWidth: 2, 
    borderColor: '#e2e8f0', 
    borderRadius: 16, 
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    maxHeight: 120,
    color: '#1e293b',
  },
  sendButton: {
    backgroundColor: '#0ea5e9',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  msg: { 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12, 
    maxWidth: '80%',
    shadowColor: '#1e293b',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  msgUser: { 
    backgroundColor: '#0ea5e9', 
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  msgBot: { 
    backgroundColor: '#fff', 
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  msgText: { 
    fontSize: 16,
    lineHeight: 22,
    color: '#1e293b',
  },
});
