import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  VStack,
  Text,
  Tag,
  HStack,
  useColorModeValue,
  Box,
  InputGroup,
  InputLeftElement,
  useToast,
  Flex,
  Badge,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: Prompt[];
  onSearch: (query: string) => void;
  onCopyPrompt?: (content: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchResults,
  onSearch,
  onCopyPrompt,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(true);
  const toast = useToast();

  // 在模态框打开时重置选中项
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setSearchQuery('');
      setIsInputFocused(true);
      // 聚焦到搜索输入框
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 当搜索结果更新且有结果时，自动取消输入框焦点
  useEffect(() => {
    if (searchResults.length > 0 && isInputFocused && searchQuery.trim() !== '') {
      // 只有在有真实查询时才自动失去焦点
      setIsInputFocused(false);
      // 从输入框移除焦点
      if (document.activeElement === searchInputRef.current) {
        (document.activeElement as HTMLElement).blur();
      }
    }
  }, [searchResults, isInputFocused, searchQuery]);

  // 处理键盘导航
  useHotkeys('esc', () => {
    if (isInputFocused) {
      // 如果焦点已经在输入框，则关闭窗口
      onClose();
    } else {
      // 如果焦点不在输入框，则将焦点设回输入框
      setIsInputFocused(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, { enabled: isOpen });

  useHotkeys('enter', () => {
    if (searchResults.length > 0 && selectedIndex >= 0 && selectedIndex < searchResults.length) {
      const selectedPrompt = searchResults[selectedIndex];
      if (onCopyPrompt) {
        onCopyPrompt(selectedPrompt.content);
      } else {
        copyToClipboard(selectedPrompt.content);
      }
    }
  }, { enabled: isOpen });

  useHotkeys('up', (e) => {
    e.preventDefault();
    if (!isInputFocused && searchResults.length > 0) {
      if (selectedIndex > 0) {
        // 不是第一个结果，正常上移
        setSelectedIndex(prev => prev - 1);
      } else if (selectedIndex === 0) {
        // 是第一个结果，焦点回到搜索框
        setIsInputFocused(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 10);
      }
    }
  }, { enabled: isOpen });

  useHotkeys('down', (e) => {
    e.preventDefault();
    if (!isInputFocused && searchResults.length > 0) {
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    }
  }, { enabled: isOpen });

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "已复制到剪贴板",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const handleCopy = (content: string) => {
    if (onCopyPrompt) {
      onCopyPrompt(content);
    } else {
      copyToClipboard(content);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    
    // 高级搜索：如果包含tag:前缀，则进行标签搜索
    if (query.includes('tag:')) {
      const tagQuery = query.split('tag:')[1].trim();
      searchByTag(tagQuery);
    } else {
      // 普通标题搜索
      onSearch(query);
    }
  };

  const searchByTag = async (tagQuery: string) => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .contains('tags', [tagQuery]);

      if (error) throw error;
      
      // 直接调用 onSearch 来更新搜索结果
      onSearch(`tag:${tagQuery}`);
    } catch (error) {
      console.error('标签搜索错误:', error);
      toast({
        title: "搜索出错",
        description: "无法搜索标签",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 监听搜索结果变化，当结果更新时关闭加载状态
  useEffect(() => {
    setIsLoading(false);
  }, [searchResults]);

  // 监听焦点状态变化
  useEffect(() => {
    if (isInputFocused && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isInputFocused]);

  // 处理点击输入框
  const handleInputClick = () => {
    setIsInputFocused(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <HStack>
            <Search size={20} />
            <Text>搜索提示</Text>
          </HStack>
        </ModalHeader>
        <ModalBody>
          <InputGroup mb={4}>
            <InputLeftElement pointerEvents="none">
              <Search size={18} color="gray" />
            </InputLeftElement>
            <Input
              ref={searchInputRef}
              placeholder="搜索提示...(使用tag:标签名可按标签搜索)"
              value={searchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setSearchQuery(query);
                handleSearch(query);
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                // 只在非空查询结果时失去焦点
                if (searchResults.length > 0 && searchQuery.trim() !== '') {
                  setIsInputFocused(false);
                }
              }}
              onClick={handleInputClick}
              autoFocus
            />
          </InputGroup>
          <VStack align="stretch" spacing={4} mb={4} maxH="60vh" overflowY="auto">
            {isLoading ? (
              <Center py={8}>
                <Spinner size="xl" />
              </Center>
            ) : searchResults.length > 0 ? (
              searchResults.map((prompt, index) => (
                <VStack
                  key={prompt.id}
                  p={4}
                  bg={index === selectedIndex 
                    ? useColorModeValue('blue.50', 'blue.900') 
                    : useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="md"
                  align="stretch"
                  cursor="pointer"
                  _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                  onClick={() => handleCopy(prompt.content)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Flex justifyContent="space-between">
                    <Text fontWeight="bold">{prompt.title}</Text>
                    {prompt.favorite && (
                      <Badge colorScheme="yellow">收藏</Badge>
                    )}
                  </Flex>
                  <Text noOfLines={2}>{prompt.content}</Text>
                  <HStack flexWrap="wrap">
                    {prompt.tags && prompt.tags.map((tag: string) => (
                      <Tag key={tag} size="sm" colorScheme="green">
                        {tag}
                      </Tag>
                    ))}
                    {prompt.models && prompt.models.map((model: string) => (
                      <Tag key={model} size="sm" colorScheme="blue">
                        {model}
                      </Tag>
                    ))}
                  </HStack>
                </VStack>
              ))
            ) : (
              <Box textAlign="center" py={4}>
                <Text color="gray.500">没有找到匹配的提示</Text>
              </Box>
            )}
          </VStack>
          {searchResults.length > 0 && (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              按 ENTER 复制选中的提示词 | 方向键↑↓切换选择 | ESC {isInputFocused ? '关闭' : '返回搜索栏'}
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};