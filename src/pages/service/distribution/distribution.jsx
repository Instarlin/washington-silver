import React, { useEffect, useState, useRef } from "react";
import { Header } from "../../../components";
import { Link, useLocation, redirect } from "react-router-dom";
import { Table, Space, Modal, Steps, Button, Upload, Select, Input, Switch, message } from 'antd';
import { 
  InboxOutlined, 
  PlusOutlined,
  FileAddOutlined, 
  CloudUploadOutlined, 
  SearchOutlined, 
  ForkOutlined, 
  FileTextOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import '../service.css';
import './distribution.css'
const { Dragger } = Upload;

const Distribution = () => {
  const [modal, openModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [current, setCurrent] = useState(0);
  const [displayPrevBtn, setDisplayPrevBtn] = useState(false);
  const [distrName, setDistrName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [selectedAlocationCategory, setSelectedAlocationCategory] = useState(null);
  const [allocID, setAllocID] = useState('');
  const [tags, setTags] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [fileType, setFileType] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [doneActive, setDoneActive] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const authToken = useLocation();

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);

  const handleValueSelection = (value) => setSelectedAlocationCategory(value);

  const getAlocations = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_PATH}/api/allocation`, {
        "name": null,
        headers: {
          "Authorization": `Bearer ${authToken.state.authToken}`,
        }
      });
      const tableList = response.data.map((value) => ({
        key: value.alloc_id,
        distribution: value.name,
        category: value.category_name,
        analys: value.is_files.toString(),
        prediction: value.is_predictions.toString(),
        is_allocation: value.is_files,
        is_prediction: value.is_predictions
      }));
      setTableData(tableList);
    } catch (e) {
      message.error(`${e.response?.data?.detail || "Error occurred"}`);
      if(e.response?.status == 401) redirect('/registration');
      console.log(e);
    };
    setTimeout(getAlocations, 60000);
  };

  const createAlocation = async (name) => {
    await axios.post(`${import.meta.env.VITE_PATH}/api/allocation`, {
      "name": name,
      "category_name": selectedAlocationCategory
    }, {
      headers: {
        "Authorization": `Bearer ${authToken.state.authToken}`,
    }});
    const response = await axios.get(`${import.meta.env.VITE_PATH}/api/allocation`, {
      "name": null,
      headers: {
        "Authorization": `Bearer ${authToken.state.authToken}`,
    }});
    response.data.map(item => {if(item.name == name) setAllocID(item.alloc_id)});
  };

  const processAllocation = async () => {
    await axios.post(`${import.meta.env.VITE_PATH}/api/allocation/process`, {
      "allocation_id": allocID,
      "rules": {},
    }, {
      headers: {
        "Authorization": `Bearer ${authToken.state.authToken}`,
      }
    });
  };

  const downloadAllocation = async (alloc_id, type) => {
    try {
      await axios.post(`${import.meta.env.VITE_PATH}/api/allocation/download`, {
        "allocation_id": alloc_id,
        "xlsx_or_csv": type,
        }, {
        headers: {
          "Authorization": `Bearer ${authToken.state.authToken}`,
        },
        responseType: 'blob'
      }).then((response) => {
        const blobUrl = URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `result.${type?'csv':'xlsx'}`;
        document.body.appendChild(link);
        link.dispatchEvent(
          new MouseEvent('click', { 
            bubbles: true,
            cancelable: true,
            view: window
          })
        );
        document.body.removeChild(link);
      });
    } catch (e) {
      message.error(e?.message)
      console.log(e);
    };
  };

  const deleteAllocations = async () => {
    for(let i = 0; i < selectedRowKeys.length; i++) {
      await axios.delete(`${import.meta.env.VITE_PATH}/api/allocation/delete_by_id`, {
        data: {
          "allocation_id": selectedRowKeys[i],
        },
        headers: {
          "Authorization": `Bearer ${authToken.state.authToken}`,
        }
      });
    };
    await getAlocations();
  };

  const deleteAllocation = async () => {
    await axios.delete(`${import.meta.env.VITE_PATH}/api/allocation/delete_by_id`, {
      data: {
        "allocation_id": allocID,
      },
      headers: {
        "Authorization": `Bearer ${authToken.state.authToken}`,
      }
    });
  };

  const uploadBills = async ({file}) => {
    setDoneActive(true);
    try {
      const formData = new FormData();
      formData.append('alloc_id', allocID);
      formData.append('bills_to_pay', file);
      const res = await axios.post(`${import.meta.env.VITE_PATH}/api/bills`, formData, {
        headers: {
          "Authorization": `Bearer ${authToken.state.authToken}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
        },
      });
      if(res) setDoneActive(false);
      message.success(`${file.name} был успешно загружен.`)
    } catch (e) {
      console.log(e);
      message.error(`Файл не был загружен.`);
    }
    
  };

  const uploadRefs = async ({file}) => {
    setDoneActive(true);
    try {
      const formData = new FormData();
      formData.append('alloc_id', allocID);
      formData.append(fileType, file);
      const res = await axios.post(`${import.meta.env.VITE_PATH}/api/bills/refs`, formData, {
        headers: {
          "Authorization": `Bearer ${authToken.state.authToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if(res) setDoneActive(false);
      message.success(`${file.name} был успешно загружен.`)
    } catch (e) {
      console.log(e);
      message.error(`Файл не был загружен.`);
    }
  };

  const getCategories = async () => {
    const response = await axios.get(`${import.meta.env.VITE_PATH}/api/category`, {
    headers: {
      "Authorization": `Bearer ${authToken.state.authToken}`,
    }});
    let list = [];
    response.data.map(item => {
      list.push(item.name)
    })
    setTags([...list]);
  };

  const createCategory = async (name) => {
    await axios.post(`${import.meta.env.VITE_PATH}/api/category`, {
      "name": name,
    }, {
      headers: {
        "Authorization": `Bearer ${authToken.state.authToken}`,
      }
    })
  };

  const options = tags.map((item) => {
    return {
      value: item,
      title: item,
    }
  });

  const items = stepsTitles.map((item) => ({
    key: item.title,
    title: item.title,
  }));

  const searchInput = useRef(null);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters();
              setSearchText('');
              handleSearch(selectedKeys, confirm, dataIndex);
            }}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? '#027540' : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  const setNextBtnState = () => {
    switch (current) {
      case 0:
        return (distrName !== '' && selectedAlocationCategory !== '')?false:true;
      case 1:
        return doneActive
      case stepsTitles.length - 1:
        return doneActive
      default:
        break;
    }
  }

  const columns = [
    {
      title: 'Название распределение',
      dataIndex: 'distribution',
      key: 'distribution',
      width: 100,
      ...getColumnSearchProps('distribution'),
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      filters: tags.map((item) => {
        return {
          text: item,
          value: item,
        }
      }),
      onFilter: (value, record) => record.category.indexOf(value) === 0,
    },
    {
      title: 'Распределение',
      dataIndex: 'analys',
      key: 'analys',
      width: 100,
      render: (_, record) => (
        <div style={{display: 'flex', flexDirection: columns, gap: 10}}>
          <Button onClick={() => downloadAllocation(record.key, false)} disabled={!record.is_allocation}>Скачать XLSX</Button>
          <Button onClick={() => downloadAllocation(record.key, true)} disabled={!record.is_allocation}>Скачать CSV</Button>
        </div>
      ),
      filters: [
        {
          text: 'С распределением',
          value: true,
        },
        {
          text: 'Без распределения',
          value: false,
        }
      ],
      onFilter: (value, record) => record.analys.indexOf(value) === 0,
    },
    {
      title: 'Анализ',
      key: 'prediction',
      width: 100,
      render: (_, record) => (
        <Button disabled={!record.is_prediction}>
          <Link to={'/service/analysis'} state={{authToken: authToken.state.authToken, id: record.key}}>Анализ {record.distribution}</Link>
        </Button>
      ),
      filters: [
        {
          text: 'C анализом',
          value: true,
        },
        {
          text: 'Без анализа',
          value: false,
        }
      ],
      onFilter: (value, record) => record.prediction.indexOf(value) === 0,
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: value => setSelectedRowKeys(value),
  };

  useEffect(() => {
    getAlocations();
    getCategories();
  }, [])

  return (
    <div className="distrWrapper">
      <Header/>
      <div className="boilerPlateHeader">
        <div style={{display: 'flex', flexDirection: 'row', flex: 5, justifyContent: 'flex-start'}}>
          <Link className="headerLink selected" to={"./"}>Распределения</Link>
          <Link className="headerLink" to={"/service/analysis"} state={{authToken: authToken.state.authToken}}>Анализ</Link>
        </div>
        <div style={{display: 'flex', flexDirection: 'row', flex: 1, justifyContent: 'flex-end', paddingRight: 25}}>
          <Link className="headerLink reg" to={"/registration"}>Сменить аккаунт</Link>
        </div>
      </div>
      <div className="boilerPlateWrapper boilerPlateWrapperDistribution">
        <div className="distributionWrapper">
          <div className="mainContent">
            <div className="sidebar">
              <div className="topBarInfo">
                <div className="topBarBtn" onClick={() => openModal(true)}>
                  <FileAddOutlined />
                  <h3>Добавить распределение</h3>
                </div>
                <div className="bottomBtn" onClick={() => setCategoryModal(true)}>
                  <PlusOutlined style={{fontSize: 'large'}}/>
                  <h4>Создать категорию</h4>
                </div>
                <div className="bottomBtn" onClick={() => deleteAllocations()}>
                  <DeleteOutlined style={{fontSize: 'large'}}/>
                  <h4>Удалить выбранное</h4>
                </div>
              </div>
            </div>
            <div className="tableWrapper">
              <Table rowSelection={rowSelection} pagination={{position: ['bottomCenter'], hideOnSinglePage: true}} columns={columns} dataSource={tableData} className="table"/>
            </div>
          </div>
        </div>
        <Modal
          title="Создать новое распределение"
          centered
          open={modal}
          onCancel={() => {
            openModal(false);
            deleteAllocation();
            handleValueSelection('');
            setDistrName('');
            setCurrent(0);
          }}
          width={'50%'}
          footer={[
            <Button 
              style={{display: displayPrevBtn?'':'none'}}
              onClick={() => {
                prev();
                if(current < 2) {setDisplayPrevBtn(false)};
              }}
            >
              {'Previous'}
            </Button>,
            <Button 
              type="primary"
              disabled={setNextBtnState()}
              onClick={() => {
                if(current === stepsTitles.length - 1) {
                  openModal(false);
                  processAllocation();
                  getAlocations();
                  handleValueSelection('');
                  setDistrName('');
                  setCurrent(0);
                  setDoneActive(true);
                } else {
                  next()
                };
                if(current > -1) setDisplayPrevBtn(true);
                if(current === 0) createAlocation(distrName);
              }}
            >
              {current === stepsTitles.length - 1?'Done':'Next'}
            </Button>,
          ]}
        >
          <Steps current={current} items={items} />
          <div className="modalContent">
            {[( 
              <div className="stepWrapper firstStep">
                <div className="firstStepWrapper">
                  <Input size='large' placeholder="Название..." variant="filled" value={distrName} onChange={e => setDistrName(e.target.value)}/>
                  <Select options={options} size='large' variant="filled" value={selectedAlocationCategory} onChange={handleValueSelection} className='selector' placeholder='Категория...'/>
                </div>
              </div>
            ),(
              <div className="stepWrapper">
                <Dragger {...{
                  name: 'file',
                  multiple: true,
                  maxCount: 3,
                  accept: '.xlsx',
                  customRequest: uploadBills,
                  format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
                }}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                </Dragger>
              </div>
            ),(
              <div className="thirdStep">
                <div>
                  <Dragger {...{
                    name: 'fixedassets',
                    multiple: false,
                    maxCount: 1,
                    accept: '.xlsx',
                    showUploadList: false,
                    customRequest: uploadRefs,
                    onChange() {
                      setFileType('fixedassets')
                    },
                    format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
                  }}>
                    <p className="ant-upload-drag-icon">
                    <CloudUploadOutlined />
                    </p>
                    <p className="ant-upload-text">Основные средства</p>
                  </Dragger>
                </div>
                <div>
                  <Dragger {...{
                    name: 'building_squares',
                    maxCount: 1,
                    accept: '.xlsx',
                    showUploadList: false,
                    customRequest: uploadRefs,
                    onChange() {
                      setFileType('building_squares')
                    },
                    format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
                  }}>
                    <p className="ant-upload-drag-icon">
                    <FileTextOutlined />
                    </p>
                    <p className="ant-upload-text">Площади зданий</p>
                  </Dragger>
                </div>
                <div style={{flex: 1}}>
                  <Dragger {...{
                    name: 'codes',
                    maxCount: 1,
                    accept: '.xlsx',
                    showUploadList: false,
                    customRequest: uploadRefs,
                    onChange() {
                      setFileType('codes')
                    },
                    format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
                  }}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Коды услуг</p>
                  </Dragger>
                </div>
                <div>
                  <Dragger {...{
                    name: 'contracts_to_building',
                    maxCount: 1,
                    accept: '.xlsx',
                    showUploadList: false,
                    customRequest: uploadRefs,
                    onChange() {
                      setFileType('contracts_to_building')
                    },
                    format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
                  }}>
                    <p className="ant-upload-drag-icon">
                    <ForkOutlined />
                    </p>
                    <p className="ant-upload-text">Связь договор - здания</p>
                  </Dragger>
                </div>
                <div>
                  <Dragger {...{
                    name: 'contacts',
                    maxCount: 1,
                    accept: '.xlsx',
                    showUploadList: false,
                    customRequest: uploadRefs,
                    onChange() {
                      setFileType('contacts')
                    },
                    format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
                  }}>
                    <p className="ant-upload-drag-icon">
                    <FileAddOutlined />
                    </p>
                    <p className="ant-upload-text">Документы</p>
                  </Dragger>
                </div>
              </div>
            ),(
              <div className="fourthStep">
                <div className={'element'}>
                  <Switch />
                  <p>Настройка 1</p>
                </div>
                <div className={'element'}>
                  <Switch />
                  <p>Настройка 2</p>
                </div>
                <div className={'element'}>
                  <Switch />
                  <p>Настройка 3</p>
                </div>
              </div>
            )][current]}
          </div>
        </Modal>
        <Modal 
          title="Создать новую категорию"
          centered
          open={categoryModal}
          onCancel={() => {setCategoryModal(false); setCategoryName('')}}
          onOk={() => {
            setCategoryModal(false);
            setTags([...tags, categoryName]);
            createCategory(categoryName);
            setCategoryName('');
          }}
        >
          <Input value={categoryName} onChange={e => setCategoryName(e.target.value)}/>
        </Modal>
      </div>
    </div>
  );
};

const stepsTitles = [
  {title: 'Название'},
  {title: 'Добавьте счета'},
  {title: 'Добавьте справочники'},
  {title: 'Настройки'},
];

export default Distribution;