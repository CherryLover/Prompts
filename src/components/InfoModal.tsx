import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  Box,
  useColorModeValue,
  Link,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FaGithub } from 'react-icons/fa';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>关于这个工具</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4} mb={4}>
            <Box>
              <Text fontWeight="bold" mb={2}>为什么要做这个工具？</Text>
              <Text>
                市面上缺乏一个简单好用的提示词管理工具。虽然备忘录或Notion等应用也可以存储提示词，
                但在使用过程中常常会中断输入流程，影响效率。
              </Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" mb={2}>这个工具的优势</Text>
              <Text>
                通过快捷键（Command+K）快速调出搜索框，上下键选择提示词，回车即可复制。
                这样设计的目的是减少在多个应用之间的切换成本，提高使用AI工具时的效率。
              </Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" mb={2}>使用技巧</Text>
              <Text>
                对于高频使用的提示词，可以设置输入快捷短语，进一步提高效率。
                例如："你可以先跟我交流一下需求，明确了要做的内容之后再写代码。"
                这类经常使用的提示，只需记住快捷短语即可快速调用。
              </Text>
            </Box>

            <Box>
              <Text fontWeight="bold" mb={2}>开源地址</Text>
              <HStack>
                <Icon as={FaGithub} boxSize={5} />
                <Link href="https://github.com/CherryLover/Prompts" isExternal color="teal.500">
                  GitHub 仓库：CherryLover/Prompts
                </Link>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 