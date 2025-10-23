import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import ContactChip from './ContactChip';

export interface SelectedContact {
  id: string;
  name: string;
}

interface EditableChipInputProps {
  selectedContacts: SelectedContact[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onRemoveContact: (id: string) => void;
  placeholder?: string;
}

export default function EditableChipInput({
  selectedContacts,
  searchQuery,
  onSearchChange,
  onRemoveContact,
  placeholder = 'search contacts...',
}: EditableChipInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && searchQuery === '' && selectedContacts.length > 0) {
      const lastContact = selectedContacts[selectedContacts.length - 1];
      onRemoveContact(lastContact.id);
    }
  };

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.label}>
        <Text style={styles.labelText}>to:</Text>
      </View>
      <View style={styles.chipContainer} onTouchEnd={handleContainerPress}>
        {selectedContacts.map((contact) => (
          <ContactChip
            key={contact.id}
            name={contact.name}
            onRemove={() => onRemoveContact(contact.id)}
          />
        ))}
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={selectedContacts.length === 0 ? placeholder : ''}
          placeholderTextColor={Colors.dark.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          onKeyPress={handleKeyPress}
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.dark.glassLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  label: {
    paddingTop: 10,
    marginRight: 8,
  },
  labelText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  chipContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 8,
    minWidth: 100,
  },
});
