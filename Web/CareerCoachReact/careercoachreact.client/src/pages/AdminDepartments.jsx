import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminDepartments() {
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [editingDepartmentId, setEditingDepartmentId] = useState(null)

    const [form, setForm] = useState({
        name: '',
    })

    const [searchText, setSearchText] = useState('')

    useEffect(() => {
        fetchDepartments()
    }, [])

    const fetchDepartments = async () => {
        try {
            setLoading(true)

            const response = await api.get('/Departments')
            setDepartments(response.data || [])
        } catch (err) {
            console.log(err)
            setMessage('Departments could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const resetForm = () => {
        setForm({
            name: '',
        })

        setEditingDepartmentId(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const payload = {
                name: form.name,
            }

            if (editingDepartmentId) {
                await api.put(`/Departments/${editingDepartmentId}`, payload)
                setMessage('Department updated successfully.')
            } else {
                await api.post('/Departments', payload)
                setMessage('Department added successfully.')
            }

            resetForm()
            await fetchDepartments()
        } catch (err) {
            console.log(err)
            setMessage(
                err.response?.data ||
                (editingDepartmentId
                    ? 'Department could not be updated.'
                    : 'Department could not be added.')
            )
        }
    }

    const editDepartment = (department) => {
        setEditingDepartmentId(department.id || department.Id)

        setForm({
            name: department.name || department.Name || '',
        })

        setMessage('')
    }

    const deleteDepartment = async (id) => {
        try {
            await api.delete(`/Departments/${id}`)
            setMessage('Department deleted successfully.')

            if (editingDepartmentId === id) {
                resetForm()
            }

            await fetchDepartments()
        } catch (err) {
            console.log(err)
            setMessage(
                err.response?.data ||
                'Department could not be deleted.'
            )
        }
    }

    const filteredDepartments = departments.filter((department) => {
        const id = department.id || department.Id
        const name = department.name || department.Name || ''

        const search = `${id} ${name}`.toLowerCase()

        return (
            searchText.trim() === '' ||
            search.includes(searchText.toLowerCase())
        )
    })

    return (
        <MainLayout
            title="Manage Departments"
            subtitle="Add and manage departments that users can select in their education profile."
        >
            {message && (
                <div className="alert alert-info rounded-4 border-0">
                    {message}
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="modern-card">
                        <h3 className="fw-bold mb-4">
                            {editingDepartmentId ? 'Update Department' : 'Add New Department'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Department Name</label>
                                <input
                                    name="name"
                                    className="form-control rounded-4"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button className="btn btn-primary rounded-4 px-4">
                                {editingDepartmentId ? 'Update Department' : 'Add Department'}
                            </button>

                            {editingDepartmentId && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-4 px-4 ms-2"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                <div className="col-lg-8">
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <div className="modern-card">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h3 className="fw-bold mb-1">Departments List</h3>
                                    <div className="text-muted small">
                                        Showing {filteredDepartments.length} of {departments.length} departments
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm rounded-4"
                                    onClick={() => setSearchText('')}
                                >
                                    Clear Search
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small text-muted">
                                    Search
                                </label>

                                <input
                                    className="form-control rounded-4"
                                    placeholder="Search by department name or id..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>

                            <div className="table-responsive admin-table-wrapper">
                                <table className="table align-middle admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Department Name</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredDepartments.length > 0 ? (
                                            filteredDepartments.map((department) => {
                                                const id = department.id || department.Id
                                                const name = department.name || department.Name

                                                return (
                                                    <tr key={id}>
                                                        <td>{id}</td>

                                                        <td className="fw-semibold">
                                                            {name}
                                                        </td>

                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <button
                                                                    className="btn btn-outline-primary btn-sm rounded-4"
                                                                    onClick={() => editDepartment(department)}
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    className="btn btn-outline-danger btn-sm rounded-4"
                                                                    onClick={() => deleteDepartment(id)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="text-center text-muted py-4">
                                                    No departments found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}

export default AdminDepartments