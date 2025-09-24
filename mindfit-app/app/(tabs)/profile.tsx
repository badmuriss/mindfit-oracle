import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, ScrollView } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUser } from '../../components/UserContext';
import { API_ENDPOINTS } from '../../constants/Api';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const { userName, userEmail, userId, token, setUserName, logout } = useUser();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(userName || '');
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  
  // Sex editing states
  const [editingSex, setEditingSex] = useState(false);
  const [tempSex, setTempSex] = useState('');
  const [sexModalVisible, setSexModalVisible] = useState(false);
  
  // Birth date editing states
  const [editingBirthDate, setEditingBirthDate] = useState(false);
  const [tempBirthDate, setTempBirthDate] = useState('');
  
  // AI Profile observation states
  const [observations, setObservations] = useState('');
  const [generatingProfile, setGeneratingProfile] = useState(false);

  // Fetch user profile data including gender and birth date
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token || !userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.USERS.PROFILE(userId), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          setUserProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token, userId]);

  const formatSexDisplay = (sex: string) => {
    switch (sex) {
      case 'MALE': return 'Masculino';
      case 'FEMALE': return 'Feminino';
      case 'NOT_INFORMED': return 'Prefiro não informar';
      default: return 'Não informado';
    }
  };

  const formatBirthDate = (birthDate: string) => {
    if (!birthDate) return 'Não informado';
    
    // Parse the ISO date string manually to avoid timezone issues
    const [year, month, day] = birthDate.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Calculate age using UTC values to avoid timezone issues
    const today = new Date();
    const birthYear = parseInt(year);
    const birthMonth = parseInt(month) - 1; // Month is 0-indexed
    const birthDay = parseInt(day);
    
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() - birthMonth;
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }
    
    return `${date.toLocaleDateString('pt-BR')} (${age} anos)`;
  };

  const formatDateInput = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    else if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    else return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };

  const validateBirthDate = (dateStr: string) => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(dateStr)) {
      return 'Formato inválido. Use DD/MM/AAAA';
    }

    const [, day, month, year] = dateStr.match(dateRegex)!;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (date.getFullYear() !== parseInt(year) || 
        date.getMonth() !== parseInt(month) - 1 || 
        date.getDate() !== parseInt(day)) {
      return 'Data inválida';
    }

    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    let adjustedAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      adjustedAge--;
    }
    
    if (adjustedAge < 13 || adjustedAge > 120) {
      return 'Idade deve estar entre 13 e 120 anos';
    }

    return null;
  };

  const formatDateForDisplay = (isoDateString: string) => {
    // Parse the ISO date string manually to avoid timezone issues
    const [year, month, day] = isoDateString.split('T')[0].split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  const convertToISODate = (ddmmyyyy: string) => {
    const [day, month, year] = ddmmyyyy.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

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
        await resp.text();
        showMessage({ message: 'Erro ao atualizar perfil.', type: 'danger' });
        return;
      }

      setUserName(tempName.trim());
      setEditing(false);
      showMessage({ message: 'Nome atualizado com sucesso!', type: 'success' });
    } catch {
      showMessage({ message: 'Erro ao conectar com o servidor.', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSex = async () => {
    if (!tempSex) {
      showMessage({ message: 'Selecione uma opção.', type: 'danger' });
      return;
    }

    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }

    setSaving(true);
    try {
      const updateData: any = { sex: tempSex };
      if (userProfile?.birthDate) {
        updateData.birthDate = userProfile.birthDate;
      }

      const resp = await fetch(API_ENDPOINTS.USERS.PROFILE(userId), {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updateData),
      });

      if (!resp.ok) {
        showMessage({ message: 'Erro ao atualizar sexo.', type: 'danger' });
        return;
      }

      setUserProfile({ ...userProfile, sex: tempSex });
      setEditingSex(false);
      setSexModalVisible(false);
      showMessage({ message: 'Sexo atualizado com sucesso!', type: 'success' });
    } catch {
      showMessage({ message: 'Erro ao conectar com o servidor.', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBirthDate = async () => {
    if (!tempBirthDate.trim()) {
      showMessage({ message: 'Data de nascimento é obrigatória.', type: 'danger' });
      return;
    }

    const validationError = validateBirthDate(tempBirthDate);
    if (validationError) {
      showMessage({ message: validationError, type: 'danger' });
      return;
    }

    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }

    setSaving(true);
    try {
      const isoDate = convertToISODate(tempBirthDate);
      const updateData: any = { birthDate: isoDate };
      if (userProfile?.sex) {
        updateData.sex = userProfile.sex;
      }

      const resp = await fetch(API_ENDPOINTS.USERS.PROFILE(userId), {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updateData),
      });

      if (!resp.ok) {
        showMessage({ message: 'Erro ao atualizar data de nascimento.', type: 'danger' });
        return;
      }

      setUserProfile({ ...userProfile, birthDate: isoDate });
      setEditingBirthDate(false);
      showMessage({ message: 'Data de nascimento atualizada com sucesso!', type: 'success' });
    } catch {
      showMessage({ message: 'Erro ao conectar com o servidor.', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateProfile = async () => {
    if (!observations.trim()) {
      showMessage({ message: 'Digite suas observações antes de continuar.', type: 'danger' });
      return;
    }

    if (!token || !userId) {
      showMessage({ message: 'Usuário não autenticado.', type: 'danger' });
      return;
    }

    setGeneratingProfile(true);
    try {
      const resp = await fetch(API_ENDPOINTS.USERS.GENERATE_PROFILE(userId), {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ observations: observations.trim() }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error('Generate profile error:', resp.status, text);
        showMessage({ message: 'Erro ao gerar perfil IA.', type: 'danger' });
        return;
      }

      setObservations(''); // Clear the input after success
      showMessage({ 
        message: 'Perfil IA atualizado com sucesso! As recomendações serão melhoradas.', 
        type: 'success' 
      });
    } catch (err) {
      console.error('Generate profile network error:', err);
      showMessage({ message: 'Erro ao conectar com o servidor.', type: 'danger' });
    } finally {
      setGeneratingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Não precisa chamar router.replace aqui pois o layout já cuida disso
    } catch {
      showMessage({ message: 'Erro ao fazer logout.', type: 'danger' });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{
          color: '#64748b',
          marginTop: 16,
          fontSize: 16,
          fontWeight: '600',
        }}>
          Carregando perfil...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
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
              <MaterialCommunityIcons name="gender-male-female" size={20} color="#f59e0b" />
              <Text style={styles.infoLabel}>Sexo</Text>
              {!editingSex && (
                <TouchableOpacity 
                  onPress={() => { 
                    setTempSex(userProfile?.sex || ''); 
                    setEditingSex(true); 
                    setSexModalVisible(true);
                  }} 
                  style={styles.editButton}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.infoValue}>
              {userProfile?.sex ? formatSexDisplay(userProfile.sex) : 'Não informado'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelRow}>
              <MaterialCommunityIcons name="calendar" size={20} color="#ef4444" />
              <Text style={styles.infoLabel}>Data de Nascimento</Text>
              {!editingBirthDate && (
                <TouchableOpacity 
                  onPress={() => { 
                    const currentDate = userProfile?.birthDate ? formatDateForDisplay(userProfile.birthDate) : '';
                    setTempBirthDate(currentDate); 
                    setEditingBirthDate(true);
                  }} 
                  style={styles.editButton}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
            
            {editingBirthDate ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={tempBirthDate}
                  onChangeText={(text) => setTempBirthDate(formatDateInput(text))}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={10}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => { 
                      setEditingBirthDate(false); 
                      setTempBirthDate('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                    onPress={handleSaveBirthDate}
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
              <Text style={styles.infoValue}>
                {userProfile?.birthDate ? formatBirthDate(userProfile.birthDate) : 'Não informado'}
              </Text>
            )}
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

      {/* AI Profile Enhancement Section */}
      <View style={styles.aiProfileCard}>
        <View style={styles.aiProfileHeader}>
          <MaterialCommunityIcons name="brain" size={28} color="#8b5cf6" />
          <Text style={styles.aiProfileTitle}>Melhorar Recomendações de IA</Text>
        </View>
        
        <Text style={styles.aiProfileSubtitle}>
          Quer adicionar alguma observação sobre você para melhorar nossas recomendações de IA?
        </Text>
        
        <TextInput
          style={styles.aiObservationInput}
          value={observations}
          onChangeText={setObservations}
          placeholder="Ex: Sou vegetariano, tenho intolerância à lactose, meu objetivo é ganhar massa muscular, prefiro exercícios de baixo impacto..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
        />
        
        <TouchableOpacity 
          style={[styles.generateProfileButton, generatingProfile && styles.generateProfileButtonDisabled]} 
          onPress={handleGenerateProfile}
          disabled={generatingProfile || !observations.trim()}
        >
          {generatingProfile ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="update" size={20} color="#fff" />
          )}
          <Text style={styles.generateProfileButtonText}>
            {generatingProfile ? 'Gerando...' : 'Atualizar Perfil IA'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color="#dc2626" />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      {/* Sex Selection Modal */}
      <Modal
        visible={sexModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSexModalVisible(false);
          setEditingSex(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Sexo</Text>
              <TouchableOpacity
                onPress={() => {
                  setSexModalVisible(false);
                  setEditingSex(false);
                }}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {[
                { value: 'MALE', label: 'Masculino', icon: 'gender-male' },
                { value: 'FEMALE', label: 'Feminino', icon: 'gender-female' },
                { value: 'NOT_INFORMED', label: 'Prefiro não informar', icon: 'help-circle' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    tempSex === option.value && styles.modalOptionSelected
                  ]}
                  onPress={() => setTempSex(option.value)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon as any} 
                    size={24} 
                    color={tempSex === option.value ? '#22c55e' : '#64748b'} 
                  />
                  <Text style={[
                    styles.modalOptionText,
                    tempSex === option.value && styles.modalOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {tempSex === option.value && (
                    <MaterialCommunityIcons name="check-circle" size={20} color="#22c55e" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => {
                  setSexModalVisible(false);
                  setEditingSex(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]} 
                onPress={handleSaveSex}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: screenWidth <= 400 ? 16 : 24,
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    maxWidth: screenWidth * 0.9,
    width: '100%',
    maxHeight: screenWidth * 1.2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 25,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalContent: {
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  modalOptionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  modalOptionTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSaveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    minWidth: 80,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  modalSaveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  // AI Profile Enhancement Styles
  aiProfileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  aiProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiProfileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 12,
    letterSpacing: -0.25,
  },
  aiProfileSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  aiObservationInput: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    color: '#0f172a',
    minHeight: 100,
    textAlignVertical: 'top',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  generateProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  generateProfileButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0.1,
  },
  generateProfileButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: 0.25,
  },
});
