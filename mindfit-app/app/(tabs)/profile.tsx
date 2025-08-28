import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';
import { API_ENDPOINTS } from '../../constants/Api';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const { userName, userEmail, userId, token, setUserName, logout } = useUser();
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(userName || '');
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      showMessage({ message: 'Nome não pode estar vazio.', type: 'danger' });
      return;
    }

    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }

    setSaving(true);
    try {
      const resp = await fetch(API_ENDPOINTS.USERS.PROFILE(userId), {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name: tempName.trim() }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.log('Failed to update profile', resp.status, text);
        showMessage({ message: 'Erro ao atualizar perfil.', type: 'danger' });
        return;
      }

      setUserName(tempName.trim());
      setEditing(false);
      showMessage({ message: 'Nome atualizado com sucesso!', type: 'success' });
    } catch (err) {
      console.log('Error updating profile:', err);
      showMessage({ message: 'Erro ao conectar com o servidor.', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Não precisa chamar router.replace aqui pois o layout já cuida disso
    } catch (error) {
      console.log('Erro durante logout:', error);
      showMessage({ message: 'Erro ao fazer logout.', type: 'danger' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-circle" size={32} color="#22c55e" />
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image 
            source={require('../../assets/images/logo_mindfit.png')} 
            style={styles.avatar} 
          />
          <View style={styles.avatarOverlay}>
            <MaterialCommunityIcons name="camera" size={20} color="#fff" />
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={styles.infoLabelRow}>
              <MaterialCommunityIcons name="account" size={20} color="#22c55e" />
              <Text style={styles.infoLabel}>Nome</Text>
              {!editing && (
                <TouchableOpacity onPress={() => { setTempName(userName || ''); setEditing(true); }} style={styles.editButton}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
            
            {editing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Digite seu nome"
                  placeholderTextColor="#94a3b8"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => { setEditing(false); setTempName(userName || ''); }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                    onPress={handleSaveName}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Salvar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.infoValue}>{userName || 'Nome não informado'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelRow}>
              <MaterialCommunityIcons name="email" size={20} color="#06b6d4" />
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <Text style={styles.infoValue}>{userEmail || 'Email não informado'}</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelRow}>
              <MaterialCommunityIcons name="identifier" size={20} color="#8b5cf6" />
              <Text style={styles.infoLabel}>ID do Usuário</Text>
            </View>
            <Text style={styles.infoValueSmall}>{userId || 'ID não disponível'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color="#dc2626" />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: screenWidth <= 400 ? 16 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenWidth <= 400 ? 24 : 32,
    paddingTop: screenWidth <= 400 ? 8 : 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 16,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 4,
    right: '30%',
    backgroundColor: '#22c55e',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  infoSection: {
    gap: 24,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 20,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  editButton: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 32,
    lineHeight: 28,
  },
  infoValueSmall: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 32,
    fontFamily: 'monospace',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  editContainer: {
    marginLeft: 32,
  },
  editInput: {
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 16,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    color: '#0f172a',
    shadowColor: '#22c55e',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    minWidth: 88,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fecaca',
    shadowColor: '#dc2626',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 17,
    marginLeft: 12,
    letterSpacing: 0.2,
  },
});