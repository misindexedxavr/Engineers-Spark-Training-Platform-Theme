from flask import Blueprint, render_template, request
from CTFd.utils.decorators import ratelimit
from CTFd.models import Teams, Solves, db
from sqlalchemy import desc
import os

def load(app):
    """
    This function is called by CTFd when loading the theme.
    We use it to override specific routes with our React app,
    AND add a custom Jinja2 page for team management.
    """
    
    # Get the theme directory
    theme_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(theme_dir, 'static')
    
    # Create a blueprint for our theme
    cyberspark = Blueprint(
        'cyberspark',
        __name__,
        static_folder='static',
        static_url_path='/themes/CyberSpark/static',
        template_folder='templates'
    )
    
    # Serve React app for user-facing routes (GET only)
    # ⚠️ NOTE: /teams is kept for default CTFd teams page
    @cyberspark.route('/', methods=['GET'])
    @cyberspark.route('/login', methods=['GET'])
    @cyberspark.route('/register', methods=['GET'])
    @cyberspark.route('/challenges', methods=['GET'])
    @cyberspark.route('/scoreboard', methods=['GET'])
    @cyberspark.route('/teams', methods=['GET'])  # Default CTFd teams page
    @cyberspark.route('/team', methods=['GET'])
    @cyberspark.route('/team-management', methods=['GET'])
    @cyberspark.route('/teams/<int:team_id>', methods=['GET'])  # React team profile
    @cyberspark.route('/users', methods=['GET'])
    @cyberspark.route('/users/<int:user_id>', methods=['GET'])
    @cyberspark.route('/profile', methods=['GET'])
    @cyberspark.route('/settings', methods=['GET'])
    def serve_react_app():
        """Serve the React app for user-facing routes (GET requests only)"""
        return render_template('base.html')
    
    # Register the blueprint BEFORE other routes
    app.register_blueprint(cyberspark)
    
    return cyberspark