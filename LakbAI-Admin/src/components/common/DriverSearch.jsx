import React, { useState, useEffect, useRef } from 'react';
import { Input, List, Card, Typography, Spin, Empty, Tag } from 'antd';
import { SearchOutlined, UserOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import DriverService from '../../services/driverService';

const { Text } = Typography;

const DriverSearch = ({ 
  onDriverSelect, 
  placeholder = "Search drivers by name or license number...",
  showAvailableOnly = false,
  selectedDriver = null,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDriverData, setSelectedDriverData] = useState(selectedDriver);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else if (searchQuery.length === 0) {
        setDrivers([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async () => {
    setLoading(true);
    try {
      let result;
      if (showAvailableOnly) {
        result = await DriverService.getAvailableDrivers();
      } else {
        result = await DriverService.searchDrivers(searchQuery, 10);
      }
      
      if (result.success) {
        setDrivers(result.drivers);
        setShowDropdown(true);
      } else {
        console.error('Search failed:', result.error);
        setDrivers([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSelect = (driver) => {
    setSelectedDriverData(driver);
    setSearchQuery(driver.name);
    setShowDropdown(false);
    onDriverSelect && onDriverSelect(driver);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If input is cleared, clear selection
    if (value === '') {
      setSelectedDriverData(null);
      onDriverSelect && onDriverSelect(null);
    }
  };

  const handleInputFocus = () => {
    if (drivers.length > 0) {
      setShowDropdown(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'error';
      case 'expired': return 'warning';
      case 'pending': return 'processing';
      default: return 'default';
    }
  };

  const getShiftStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input
        ref={searchRef}
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        prefix={<SearchOutlined />}
        suffix={loading ? <Spin size="small" /> : null}
        disabled={disabled}
        style={{ width: '100%' }}
      />
      
      {showDropdown && (
        <Card
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
            marginTop: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          bodyStyle={{ padding: '8px' }}
        >
          {drivers.length > 0 ? (
            <List
              size="small"
              dataSource={drivers}
              renderItem={(driver) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => handleDriverSelect(driver)}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <Text strong style={{ fontSize: '14px' }}>
                        <UserOutlined style={{ marginRight: '6px' }} />
                        {driver.name}
                      </Text>
                      <div>
                        <Tag color={getStatusColor(driver.license_status)} size="small">
                          {driver.license_status}
                        </Tag>
                        <Tag color={getShiftStatusColor(driver.shift_status)} size="small">
                          {driver.shift_status}
                        </Tag>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <IdcardOutlined style={{ marginRight: '4px' }} />
                        License: {driver.license_number}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <PhoneOutlined style={{ marginRight: '4px' }} />
                        {driver.phone}
                      </Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchQuery.length >= 2 
                  ? "No drivers found" 
                  : "Type at least 2 characters to search"
              }
              style={{ padding: '20px 0' }}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default DriverSearch;
