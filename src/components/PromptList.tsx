import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Tag,
  HStack,
  Flex,
  IconButton,
  useToast,
  Badge,
  Spinner,
  Center,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { Star, Copy, Trash, StarOff, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';

interface PromptListProps {
  searchModalOpen?: boolean;
}

export const PromptList = forwardRef<{ refresh: () => Promise<void> }, PromptListProps>((props, ref) => {
  const { searchModalOpen = false } = props;
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [editTagInput, setEditTagInput] = useState<string>('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editModelInput, setEditModelInput] = useState<string>('');
  const [editModels, setEditModels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const toast = useToast();
  const selectedItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('favorite', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPrompts(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      toast({
        title: '加载提示词失败',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchPrompts
  }));

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .update({ favorite: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // 更新本地状态
      setPrompts(
        prompts.map((prompt) =>
          prompt.id === id ? { ...prompt, favorite: !currentStatus } : prompt
        )
      );

      toast({
        title: currentStatus ? '已取消收藏' : '已添加到收藏',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      fetchPrompts(); // 刷新列表
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      toast({
        title: '操作失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const copyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: '已复制到剪贴板',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const deletePrompt = async (id: string) => {
    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);

      if (error) throw error;

      // 更新本地状态
      setPrompts(prompts.filter((prompt) => prompt.id !== id));

      toast({
        title: '提示词已删除',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      fetchPrompts(); // 刷新列表
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      toast({
        title: '删除失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openEditModal = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
    setEditTags(prompt.tags || []);
    setEditModels(prompt.models || []);
    onEditOpen();
  };

  const handleEditTagInput = (e: React.KeyboardEvent) => {
    if (e.key === ',' && editTagInput.trim()) {
      setEditTags([...editTags, editTagInput.trim()]);
      setEditTagInput('');
    } else if (e.key === 'Enter' && editTagInput.trim()) {
      e.preventDefault(); // 防止表单提交
      setEditTags([...editTags, editTagInput.trim()]);
      setEditTagInput('');
    }
  };

  const handleEditModelInput = (e: React.KeyboardEvent) => {
    if (e.key === ',' && editModelInput.trim()) {
      setEditModels([...editModels, editModelInput.trim()]);
      setEditModelInput('');
    } else if (e.key === 'Enter' && editModelInput.trim()) {
      e.preventDefault(); // 防止表单提交
      setEditModels([...editModels, editModelInput.trim()]);
      setEditModelInput('');
    }
  };

  const addEditTag = () => {
    if (editTagInput.trim()) {
      setEditTags([...editTags, editTagInput.trim()]);
      setEditTagInput('');
    }
  };

  const addEditModel = () => {
    if (editModelInput.trim()) {
      setEditModels([...editModels, editModelInput.trim()]);
      setEditModelInput('');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletePromptId(id);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!deletePromptId) return;
    await deletePrompt(deletePromptId);
    onDeleteClose();
    setDeletePromptId(null);
  };

  const handleUpdate = async () => {
    if (!currentPrompt) return;
    
    setIsSubmitting(true);
    try {
      // 准备数据，确保数组不为空
      const tagsValue = editTags.length > 0 ? editTags : null;
      const modelsValue = editModels.length > 0 ? editModels : null;
      
      console.log('更新数据:', { 
        title: editTitle, 
        content: editContent, 
        tags: tagsValue, 
        models: modelsValue 
      });
      
      const { error } = await supabase
        .from('prompts')
        .update({
          title: editTitle,
          content: editContent,
          tags: tagsValue,
          models: modelsValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentPrompt.id);

      if (error) throw error;

      toast({
        title: '提示词已更新',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      onEditClose();
      fetchPrompts(); // 刷新列表
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      toast({
        title: '更新失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加键盘导航处理函数
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 获取当前选中的标签页
    const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
    const isPromptListTab = activeTab?.textContent?.includes('提示词列表');

    // 如果编辑模态框、删除确认框或搜索框打开，不处理键盘事件
    if (isEditOpen || isDeleteOpen || searchModalOpen) {
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < prompts.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && isPromptListTab) {
      e.preventDefault();
      copyPrompt(prompts[selectedIndex].content);
    }
  }, [prompts, selectedIndex, isEditOpen, isDeleteOpen, searchModalOpen]);

  // 当选中项改变时，确保它在视图中可见
  useEffect(() => {
    if (selectedIndex >= 0 && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  // 添加键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <Center p={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" color="red.800" borderRadius="md">
        <Text>加载失败: {error}</Text>
        <Button mt={4} onClick={fetchPrompts}>重试</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={4}>
        提示词列表
      </Heading>
      {prompts.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={8}>
          暂无提示词，请添加一条
        </Text>
      ) : (
        <VStack spacing={4} align="stretch" maxH="70vh" overflowY="auto" p={2}>
          {prompts.map((prompt, index) => (
            <Box
              key={prompt.id}
              ref={index === selectedIndex ? selectedItemRef : null}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              boxShadow="sm"
              position="relative"
              borderColor={index === selectedIndex ? "green.500" : "gray.200"}
              transition="all 0.2s"
              _hover={{
                borderColor: "green.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-green-500)",
                transform: "translateY(-1px)",
              }}
              onClick={() => setSelectedIndex(index)}
              cursor="pointer"
            >
              <Flex justifyContent="space-between" alignItems="flex-start">
                <Box flex="1" minW="0">
                  <Heading size="sm" mb={2}>
                    {prompt.title}
                    {prompt.favorite && (
                      <Badge ml={2} colorScheme="yellow">
                        收藏
                      </Badge>
                    )}
                  </Heading>
                  <Text 
                    fontSize="sm" 
                    color="gray.600" 
                    mb={3} 
                    noOfLines={3}
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                  >
                    {prompt.content}
                  </Text>
                  
                  <Flex alignItems="center" flexWrap="wrap">
                    {prompt.models && prompt.models.length > 0 && (
                      <>
                        <Text fontSize="xs" fontWeight="bold" color="gray.500" mr={1}>
                          适用模型:
                        </Text>
                        {prompt.models.map((model: string) => (
                          <Tag key={model} size="sm" colorScheme="blue" mr={1} mb={1}>
                            {model}
                          </Tag>
                        ))}
                      </>
                    )}
                    
                    {prompt.tags && prompt.tags.length > 0 && (
                      <>
                        <Text fontSize="xs" fontWeight="bold" color="gray.500" mr={1} ml={prompt.models && prompt.models.length > 0 ? 2 : 0}>
                          标签:
                        </Text>
                        {prompt.tags.map((tag: string) => (
                          <Tag key={tag} size="sm" colorScheme="green" mr={1} mb={1}>
                            {tag}
                          </Tag>
                        ))}
                      </>
                    )}
                  </Flex>
                </Box>
                <HStack ml={4} flexShrink={0}>
                  <IconButton
                    aria-label="编辑"
                    icon={<Edit size={18} />}
                    size="sm"
                    colorScheme="teal"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(prompt);
                    }}
                  />
                  <IconButton
                    aria-label={prompt.favorite ? '取消收藏' : '添加收藏'}
                    icon={prompt.favorite ? <StarOff size={18} /> : <Star size={18} />}
                    size="sm"
                    colorScheme={prompt.favorite ? 'yellow' : 'gray'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(prompt.id, prompt.favorite);
                    }}
                  />
                  <IconButton
                    aria-label="复制内容"
                    icon={<Copy size={18} />}
                    size="sm"
                    colorScheme="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPrompt(prompt.content);
                    }}
                  />
                  <IconButton
                    aria-label="删除"
                    icon={<Trash size={18} />}
                    size="sm"
                    colorScheme="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(prompt.id);
                    }}
                  />
                </HStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}

      {/* 编辑提示词的模态框 */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>编辑提示词</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>标题</FormLabel>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>内容</FormLabel>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  minH="200px"
                />
              </FormControl>

              <FormControl>
                <FormLabel>标签</FormLabel>
                <HStack>
                  <Input
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={handleEditTagInput}
                    placeholder="输入标签后按回车或逗号添加"
                    flex="1"
                  />
                  <Button size="md" onClick={addEditTag} colorScheme="green">
                    添加
                  </Button>
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  提示：输入标签后按回车、逗号或点击添加按钮
                </Text>
                <HStack mt={2} wrap="wrap">
                  {editTags.map((tag) => (
                    <Tag
                      key={tag}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      colorScheme="green"
                    >
                      <Text>{tag}</Text>
                      <IconButton
                        aria-label="删除标签"
                        icon={<Trash size={12} />}
                        size="xs"
                        ml={1}
                        onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
                      />
                    </Tag>
                  ))}
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>推荐模型</FormLabel>
                <HStack>
                  <Input
                    value={editModelInput}
                    onChange={(e) => setEditModelInput(e.target.value)}
                    onKeyDown={handleEditModelInput}
                    placeholder="输入模型后按回车或逗号添加"
                    flex="1"
                  />
                  <Button size="md" onClick={addEditModel} colorScheme="blue">
                    添加
                  </Button>
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  提示：输入模型后按回车、逗号或点击添加按钮
                </Text>
                <HStack mt={2} wrap="wrap">
                  {editModels.map((model) => (
                    <Tag
                      key={model}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      colorScheme="blue"
                    >
                      <Text>{model}</Text>
                      <IconButton
                        aria-label="删除模型"
                        icon={<Trash size={12} />}
                        size="xs"
                        ml={1}
                        onClick={() => setEditModels(editModels.filter((m) => m !== model))}
                      />
                    </Tag>
                  ))}
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              取消
            </Button>
            <Button 
              colorScheme="green" 
              onClick={handleUpdate}
              isLoading={isSubmitting}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认对话框 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>确认删除</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>确定要删除这个提示词吗？此操作不可恢复。</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              取消
            </Button>
            <Button colorScheme="red" onClick={handleDeleteConfirm}>
              删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}); 