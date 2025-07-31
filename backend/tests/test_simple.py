import pytest

def test_simple_math():
    """Simple test to verify pytest is working."""
    assert 2 + 2 == 4

def test_string_operations():
    """Test string operations."""
    text = "Hello World"
    assert len(text) == 11
    assert "Hello" in text
    assert text.upper() == "HELLO WORLD"

@pytest.mark.unit
def test_list_operations():
    """Test list operations."""
    numbers = [1, 2, 3, 4, 5]
    assert len(numbers) == 5
    assert sum(numbers) == 15
    assert max(numbers) == 5
    assert min(numbers) == 1

class TestSimpleClass:
    """Simple test class."""
    
    def test_instance_method(self):
        """Test instance method."""
        assert True
    
    @pytest.mark.unit
    def test_with_marker(self):
        """Test with pytest marker."""
        assert True 