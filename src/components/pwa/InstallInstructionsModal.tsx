'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  Text,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';
import { usePWAInstall } from '@/contexts/PWAInstallContext';

export default function InstallInstructionsModal() {
  const { instructionsOpen, closeInstructions, isIOS, canNativeInstall, promptInstall } =
    usePWAInstall();

  const handleInstall = async () => {
    if (canNativeInstall) {
      await promptInstall();
      closeInstructions();
      return;
    }
    closeInstructions();
  };

  return (
    <Modal isOpen={instructionsOpen} onClose={closeInstructions} isCentered size="md">
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader color="#1a365d">Install SATRF App</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isIOS ? (
            <>
              <Text mb={3} fontSize="sm" color="gray.600">
                Add SATRF to your home screen for quick access to events, results and notices.
              </Text>
              <List spacing={2} fontSize="sm" color="gray.700">
                <ListItem display="flex" alignItems="flex-start" gap={2}>
                  <ListIcon as={FiCheck} color="green.500" mt={1} />
                  Tap the Share button in Safari (square with arrow)
                </ListItem>
                <ListItem display="flex" alignItems="flex-start" gap={2}>
                  <ListIcon as={FiCheck} color="green.500" mt={1} />
                  Scroll down and choose &quot;Add to Home Screen&quot;
                </ListItem>
                <ListItem display="flex" alignItems="flex-start" gap={2}>
                  <ListIcon as={FiCheck} color="green.500" mt={1} />
                  Tap Add — SATRF will appear on your home screen
                </ListItem>
              </List>
            </>
          ) : (
            <>
              <Text mb={3} fontSize="sm" color="gray.600">
                Install SATRF for faster access to events, results and notices.
              </Text>
              <List spacing={2} fontSize="sm" color="gray.700">
                {canNativeInstall ? (
                  <ListItem display="flex" alignItems="flex-start" gap={2}>
                    <ListIcon as={FiCheck} color="green.500" mt={1} />
                    Tap Install below to add SATRF to your device
                  </ListItem>
                ) : (
                  <>
                    <ListItem display="flex" alignItems="flex-start" gap={2}>
                      <ListIcon as={FiCheck} color="green.500" mt={1} />
                      Look for the install icon in your browser address bar
                    </ListItem>
                    <ListItem display="flex" alignItems="flex-start" gap={2}>
                      <ListIcon as={FiCheck} color="green.500" mt={1} />
                      Or open the browser menu and choose &quot;Install app&quot; / &quot;Add to
                      Home screen&quot;
                    </ListItem>
                  </>
                )}
              </List>
            </>
          )}
        </ModalBody>
        <ModalFooter gap={2}>
          {canNativeInstall && (
            <Button colorScheme="red" bg="#e53e3e" _hover={{ bg: '#c53030' }} onClick={handleInstall}>
              Install
            </Button>
          )}
          <Button variant="ghost" onClick={closeInstructions}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
