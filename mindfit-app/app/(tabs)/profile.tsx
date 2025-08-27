import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';

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
      const resp = await fetch(`https://mindfitapi.outis.com.br/users/${userId}`, {
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
    await logout();
    showMessage({ message: 'Logout realizado.', type: 'success' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-circle" size={32} color="#0ea5e9" />
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
              <MaterialCommunityIcons name="account" size={20} color="#0ea5e9" />
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
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 12,
    color: '#1e293b',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1e293b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#0ea5e9',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#0ea5e9',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoSection: {
    gap: 20,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 28,
  },
  infoValueSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 28,
    fontFamily: 'monospace',
  },
  editContainer: {
    marginLeft: 28,
  },
  editInput: {
    borderWidth: 2,
    borderColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0ea5e9',
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1e293b',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});